const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther },
		BigNumber
	},
	deployments: { fixture, createFixture },
	ethers
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetToken = await getContract("SweetpadToken");
	const sweetpadFreezing = await getContract("SweetpadFreezing");

	const router = await ethers.getContractAt("IPancakeRouter02", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
	const factory = await ethers.getContractAt("IPancakeFactory", "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
	const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

	return [sweetpadFreezing, sweetToken, router, factory, weth];
});

describe("SweetpadFreezing", function () {
	let deployer, caller, sweetpadFreezing, sweetToken, router, factory, weth, lpAddress, lp;

	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadFreezing, sweetToken, router, factory, weth] = await setupFixture();
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
		it("freezeWithBNB function ", async function () {
			const callerETHBalance = await ethers.provider.getBalance(caller.address);

			const tx = await sweetpadFreezing
				.connect(caller)
				.freezeWithBNB(3650, (await ethers.provider.getBlock()).timestamp + 100, {
					value: ethers.utils.parseUnits("100")
				});

			const fee = tx.gasPrice * (await tx.wait()).gasUsed;
			const generatedLP = await lp.balanceOf(sweetpadFreezing.address);

			expect(await ethers.provider.getBalance(caller.address)).to.equal(
				callerETHBalance.sub(ethers.utils.parseUnits("100").add(fee))
			);

			expect(await sweetpadFreezing.totalPower(caller.address)).to.equal(generatedLP.mul(5));
			expect(await sweetpadFreezing.freezeInfo(caller.address, 0)).to.eql([
				BigNumber.from(tx.blockNumber).add(3650),
				BigNumber.from(3650),
				BigNumber.from(generatedLP),
				BigNumber.from(generatedLP).mul(5),
				1
			]);
		});
	});
});