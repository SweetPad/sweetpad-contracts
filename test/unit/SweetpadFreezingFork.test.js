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
	const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

	return [sweetpadFreezing, sweetToken, router, factory, weth];
});

describe("SweetpadFreezingFork", function () {
	let deployer, caller, sweetpadFreezing, sweetToken, router, factory, weth, lpAddress, lp, oneYear;

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
		[sweetpadFreezing, sweetToken, router, factory, weth] = await setupFixture();
		oneYear = await daysToBlocks(10);
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
		lpAddress = await factory.getPair(sweetToken.address, weth);
		lp = await ethers.getContractAt("SweetpadToken", lpAddress);
		await sweetpadFreezing.setLPToken(lpAddress);
		await sweetpadFreezing.setMultiplier(500);
	});

	describe("Freeze LP with BNB", function () {
		it("Should revert if power is less than 10000 xSWT", async function () {
			await expect(sweetpadFreezing
				.connect(caller)
				.freezeWithBNB(oneYear, 0, 0, 0, (await ethers.provider.getBlock()).timestamp + 100, {
					value: ethers.utils.parseUnits("1")
				})).to.be.revertedWith("SweetpadFreezing: At least 10.000 xSWT is required");
		});

		it("freezeWithBNB function ", async function () {
			let callerETHBalance = await ethers.provider.getBalance(caller.address);

			let tx = await sweetpadFreezing
				.connect(caller)
				.freezeWithBNB(oneYear, 0, 0, 0, (await ethers.provider.getBlock()).timestamp + 100, {
					value: ethers.utils.parseUnits("100")
				});

			let fee = tx.gasPrice * (await tx.wait()).gasUsed;
			let generatedLP = await lp.balanceOf(sweetpadFreezing.address);

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

			callerETHBalance = await ethers.provider.getBalance(caller.address);
			const totalPower = await sweetpadFreezing.totalPower(caller.address);
			const lpBalance = await lp.balanceOf(sweetpadFreezing.address);

			tx = await sweetpadFreezing
				.connect(caller)
				.freezeWithBNB(oneYear, 0, 0, 0, (await ethers.provider.getBlock()).timestamp + 100, {
					value: ethers.utils.parseUnits("100")
				});

			fee = tx.gasPrice * (await tx.wait()).gasUsed;
			const lpBalanceAfter = await lp.balanceOf(sweetpadFreezing.address);
			generatedLP = lpBalanceAfter.sub(lpBalance);

			expect(await ethers.provider.getBalance(caller.address)).to.equal(
				callerETHBalance.sub(ethers.utils.parseUnits("100").add(fee))
			);
			expect(await sweetpadFreezing.totalPower(caller.address)).to.equal(totalPower.add(generatedLP.mul(5)));
			expect(await sweetpadFreezing.freezeInfo(caller.address, 1)).to.eql([
				BigNumber.from(tx.blockNumber).add(oneYear),
				BigNumber.from(oneYear),
				BigNumber.from(generatedLP),
				BigNumber.from(generatedLP).mul(5),
				1
			]);
		});
	});
});
