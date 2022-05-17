const { expect } = require("chai");
const { BigNumber } = require("ethers");
const {
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther }
	},
	deployments: { fixture, createFixture }
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetToken = await getContract("SweetpadToken");
	const staking = await getContract("Staking");

	return [staking, sweetToken];
});

describe("Staking", function () {
	let deployer, caller, staking, sweetToken;

	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[staking, sweetToken] = await setupFixture();
		await sweetToken.connect(deployer).transfer(caller.address, parseEther("15000"));
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await staking.sweetToken()).to.equal(sweetToken.address);
			console.log((await sweetToken.balanceOf(deployer.address)).toString());
		});
	});

	describe("StakeSWT function: ", function () {
		it("Should revert with 'Wrong period'", async function () {
			await expect(staking.connect(deployer).stakeSWT(parseEther("10000"), 181)).to.be.revertedWith(
				"Wrong period"
			);
			await expect(staking.connect(deployer).stakeSWT(parseEther("10000"), 1100)).to.be.revertedWith(
				"Wrong period"
			);
		});
		it("Should revert with 'INSUFFICIENT TOKENS'", async function () {
			await expect(staking.connect(caller).stakeSWT(parseEther("20000"), 182)).to.be.revertedWith(
				"INSUFFICIENT TOKENS"
			);
		});

		it("Should revert with 'At least 10.000 xSWT is required'", async function () {
			await expect(staking.connect(caller).stakeSWT(parseEther("15000"), 182)).to.be.revertedWith(
				"At least 10.000 xSWT is required"
			);
		});

		it("Should stake with min period, than stake again", async function () {
			await sweetToken.connect(deployer).approve(staking.address, parseEther("40000"));
			let stakeTX = await staking.connect(deployer).stakeSWT(parseEther("20000"), 182);
			let lockedPeriod = BigNumber.from(stakeTX.blockNumber).add(
				BigNumber.from(182).mul(await staking.BLOCKS_PER_DAY())
			);
			expect(await staking.totalPower(deployer.address)).to.equal(parseEther("10000"));
			expect(await staking.stakes(deployer.address, 0)).to.eql([
				BigNumber.from(lockedPeriod),
				parseEther("20000"),
				parseEther("10000")
			]);
			const totalPower = await staking.totalPower(deployer.address);
			stakeTX = await staking.connect(deployer).stakeSWT(parseEther("20000"), 365);
			lockedPeriod = BigNumber.from(stakeTX.blockNumber).add(
				BigNumber.from(365).mul(await staking.BLOCKS_PER_DAY())
			);

			expect((await staking.getStakes(deployer.address)).length).to.equal(2);
			expect(await staking.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).add(parseEther("20000"))
			);
			expect(await staking.stakes(deployer.address, 1)).to.eql([
				BigNumber.from(lockedPeriod),
				parseEther("20000"),
				parseEther("20000")
			]);
		});
	});
});
