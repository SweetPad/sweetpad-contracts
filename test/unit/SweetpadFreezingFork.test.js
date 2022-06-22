const { expect } = require("chai");
const {
	ethers: {
		getContract,
		utils: { parseEther },
		BigNumber
	},
	deployments: { fixture, createFixture },
	ethers
} = require("hardhat");
const hre = require("hardhat");
const DEPLOYER = "0x4bd5b80ADb4eEC52e58b46c8748C6e9B4524CcA8";
const CALLER = "0xa6A62c0110762c52cFB7303BA1F9A2e8b25CBdA7";

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetToken = await getContract("SweetpadToken");
	const sweetpadFreezing = await getContract("SweetpadFreezing");

	const router = await ethers.getContractAt("IApeRouter02", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
	const factory = await ethers.getContractAt("IApeFactory", "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
	const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
	const busdAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

	return [sweetpadFreezing, sweetToken, router, factory, wethAddress, busdAddress];
});

describe("SweetpadFreezingFork", function () {
	let deployer,
		caller,
		sweetpadFreezing,
		sweetToken,
		router,
		factory,
		wethAddress,
		lpAddress,
		lp,
		oneYear,
		busdAddress,
		busd,
		generatedLP;

	const daysToBlocks = async (days) => {
		return (await sweetpadFreezing.getBlocksPerDay()).mul(days);
	};

	before("Before All: ", async function () {
		[deployer, caller] = await Promise.all(
			[DEPLOYER, CALLER].map(async (address) => {
				await hre.network.provider.request({
					method: "hardhat_impersonateAccount",
					params: [address]
				});
				return await ethers.getSigner(address);
			})
		);
	});

	beforeEach(async function () {
		[sweetpadFreezing, sweetToken, router, factory, wethAddress, busdAddress] = await setupFixture();
		oneYear = await daysToBlocks(10);
		busd = await ethers.getContractAt("SweetpadToken", busdAddress);
		await sweetpadFreezing.setMultiplier(250);
		await sweetToken.connect(deployer).transfer(caller.address, parseEther("15000"));
		await sweetToken.connect(deployer).approve(router.address, ethers.utils.parseUnits("10000000"));
		// Add liquidity for BNB/SWT pair
		await router
			.connect(deployer)
			.addLiquidityETH(
				sweetToken.address,
				ethers.utils.parseUnits("10000000"),
				0,
				0,
				deployer.address,
				(await ethers.provider.getBlock()).timestamp + 100,
				{ value: ethers.utils.parseUnits("1000") }
			);
		// Get Pair address and contract
		lpAddress = await factory.getPair(sweetToken.address, wethAddress);
		lp = await ethers.getContractAt("SweetpadToken", lpAddress);

		// Swap to get BUSD
		await router
			.connect(deployer)
			.swapExactETHForTokens(
				0,
				[wethAddress, busdAddress],
				deployer.address,
				(await ethers.provider.getBlock()).timestamp + 100,
				{ value: ethers.utils.parseUnits("1000") }
			);
		await sweetpadFreezing.setLPToken(lpAddress);
		await sweetpadFreezing.setMultiplier(500);
	});

	describe("Freeze LP with BNB", function () {
		it("Should revert if power is less than 10000 xSWT", async function () {
			await expect(
				sweetpadFreezing
					.connect(caller)
					.freezeWithBNB(oneYear, 0, 0, 0, (await ethers.provider.getBlock()).timestamp + 100, {
						value: ethers.utils.parseUnits("1")
					})
			).to.be.revertedWith("SweetpadFreezing: At least 10.000 xSWT is required");
		});

		it("freezeWithBNB function ", async function () {
			const callerETHBalance = await ethers.provider.getBalance(caller.address);

			const tx = await sweetpadFreezing
				.connect(caller)
				.freezeWithBNB(oneYear, 0, 0, 0, (await ethers.provider.getBlock()).timestamp + 100, {
					value: ethers.utils.parseUnits("100")
				});

			const fee = tx.gasPrice * (await tx.wait()).gasUsed;
			generatedLP = await lp.balanceOf(sweetpadFreezing.address);

			expect(await ethers.provider.getBalance(caller.address)).to.equal(
				callerETHBalance.sub(ethers.utils.parseUnits("100").add(fee))
			);

			expect(await sweetpadFreezing.totalPower(caller.address)).to.equal(generatedLP.mul(5));
			expect(await sweetpadFreezing.freezeInfo(caller.address, 0)).to.eql([
				BigNumber.from(tx.blockNumber).add(oneYear),
				BigNumber.from(oneYear),
				BigNumber.from(generatedLP),
				BigNumber.from(generatedLP).mul(5),
				1
			]);
		});

		it("Should emit Freeze event with correct args for freezing with BNB", async function () {
			await expect(
				await sweetpadFreezing
					.connect(deployer)
					.freezeWithBNB(oneYear, 0, 0, 0, (await ethers.provider.getBlock()).timestamp + 100, {
						value: ethers.utils.parseUnits("100")
					})
			)
				.to.emit(sweetpadFreezing, "Freeze")
				.withArgs(
					(await sweetpadFreezing.getFreezes(deployer.address)).length - 1,
					deployer.address,
					BigNumber.from(generatedLP),
					BigNumber.from(generatedLP).mul(5),
					1
				);
		});
	});

	describe("Freeze LP with BUSD", function () {
		it("Should revert if power is less than 10000 xSWT", async function () {
			await busd.connect(deployer).approve(sweetpadFreezing.address, ethers.utils.parseUnits("10"));
			await expect(
				sweetpadFreezing
					.connect(deployer)
					.freezeWithBUSD(
						ethers.utils.parseUnits("10"),
						0,
						0,
						0,
						0,
						oneYear,
						(await ethers.provider.getBlock()).timestamp + 100
					)
			).to.be.revertedWith("SweetpadFreezing: At least 10.000 xSWT is required");
		});

		it("freezeWithBUSD function ", async function () {
			const busdBalance = await busd.balanceOf(deployer.address);

			await busd.connect(deployer).approve(sweetpadFreezing.address, ethers.utils.parseUnits("100000"));

			const tx = await sweetpadFreezing
				.connect(deployer)
				.freezeWithBUSD(
					ethers.utils.parseUnits("100000"),
					0,
					0,
					0,
					0,
					oneYear,
					(await ethers.provider.getBlock()).timestamp + 100
				);

			generatedLP = await lp.balanceOf(sweetpadFreezing.address);

			expect(await busd.balanceOf(deployer.address)).to.equal(busdBalance.sub(ethers.utils.parseUnits("100000")));

			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(generatedLP.mul(5));
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 0)).to.eql([
				BigNumber.from(tx.blockNumber).add(oneYear),
				BigNumber.from(oneYear),
				BigNumber.from(generatedLP),
				BigNumber.from(generatedLP).mul(5),
				1
			]);
		});

		it("Should emit Freeze event with correct args for freezing with BUSD", async function () {
			await busd.connect(deployer).approve(sweetpadFreezing.address, parseEther("100000"));
			await expect(
				await sweetpadFreezing
					.connect(deployer)
					.freezeWithBUSD(
						ethers.utils.parseUnits("100000"),
						0,
						0,
						0,
						0,
						oneYear,
						(await ethers.provider.getBlock()).timestamp + 100
					)
			)
				.to.emit(sweetpadFreezing, "Freeze")
				.withArgs(
					(await sweetpadFreezing.getFreezes(deployer.address)).length - 1,
					deployer.address,
					BigNumber.from(generatedLP),
					BigNumber.from(generatedLP).mul(5),
					1
				);
		});
	});
});
