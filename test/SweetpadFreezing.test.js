const { expect } = require("chai");
const { BigNumber, constants } = require("ethers");
const {
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther }
	},
	deployments: { fixture, createFixture },
	timeAndMine
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetToken = await getContract("SweetpadToken");
	const sweetpadFreezing = await getContract("SweetpadFreezing");

	return [sweetpadFreezing, sweetToken];
});

describe("SweetpadFreezing", function () {
	let deployer, caller, sweetpadFreezing, sweetToken;
	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadFreezing, sweetToken] = await setupFixture();
		await sweetToken.connect(deployer).transfer(caller.address, parseEther("15000"));
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadFreezing.sweetToken()).to.equal(sweetToken.address);
		});
	});

	describe("FreezeSWT function", function () {
		it("Should revert with 'SweetpadFreezing: Wrong period'", async function () {
			await expect(sweetpadFreezing.connect(deployer).freezeSWT(parseEther("10000"), 181)).to.be.revertedWith(
				"SweetpadFreezing: Wrong period"
			);
			await expect(sweetpadFreezing.connect(deployer).freezeSWT(parseEther("10000"), 1100)).to.be.revertedWith(
				"SweetpadFreezing: Wrong period"
			);
		});
		it("Should revert with 'SweetpadFreezing: Insufficient tokens'", async function () {
			await expect(sweetpadFreezing.connect(caller).freezeSWT(parseEther("20000"), 182)).to.be.revertedWith(
				"SweetpadFreezing: Insufficient tokens"
			);
		});

		it("Should revert with 'SweetpadFreezing: At least 10.000 xSWT is required'", async function () {
			await expect(sweetpadFreezing.connect(caller).freezeSWT(parseEther("15000"), 182)).to.be.revertedWith(
				"SweetpadFreezing: At least 10.000 xSWT is required"
			);
		});

		it("Should stake with min period, than stake again", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			const swtBalance = await sweetToken.balanceOf(deployer.address);
			let stakeTX = await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), 182);
			let lockedPeriod = BigNumber.from(stakeTX.blockNumber).add(
				BigNumber.from(182).mul(await sweetpadFreezing.BLOCKS_PER_DAY())
			);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(parseEther("10000"));
			expect(await sweetpadFreezing.stakes(deployer.address, 0)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from("182"),
				parseEther("20000"),
				parseEther("10000")
			]);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.sub(parseEther("20000")));
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);
			stakeTX = await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), 365);
			lockedPeriod = BigNumber.from(stakeTX.blockNumber).add(
				BigNumber.from(365).mul(await sweetpadFreezing.BLOCKS_PER_DAY())
			);

			expect((await sweetpadFreezing.getStakes(deployer.address)).length).to.equal(2);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).add(parseEther("20000"))
			);
			expect(await sweetpadFreezing.stakes(deployer.address, 1)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from("365"),
				parseEther("20000"),
				parseEther("20000")
			]);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.sub(parseEther("40000")));
		});
	});

	describe("UnfreezeSWT function", function () {
		it("Should revert with 'SweetpadFreezing: At least 10.000 xSWT is required'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 182);
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("30000"))).to.be.revertedWith(
				"SweetpadFreezing: At least 10.000 xSWT is required"
			);
		});

		it("Should revert with 'SweetpadFreezing: Wrong id'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 182);
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(1, parseEther("30000"))).to.be.revertedWith(
				"SweetpadFreezing: Wrong id"
			);
		});

		it("Should revert with 'SweetpadFreezing: Staked amount is Zero'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 182);

			await timeAndMine.mine((await sweetpadFreezing.stakes(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"));
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"))).to.be.revertedWith(
				"SweetpadFreezing: Staked amount is Zero"
			);
		});

		it("Should revert with 'SweetpadFreezing: Locked period dosn`t pass'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 182);

			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"))).to.be.revertedWith(
				"SweetpadFreezing: Locked period dosn`t pass"
			);
		});

		it("Should unstake partial", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 182);
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);
			const power = (await sweetpadFreezing.stakes(deployer.address, 0)).power;

			const swtBalance = await sweetToken.balanceOf(deployer.address);

			await timeAndMine.mine((await sweetpadFreezing.stakes(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"));
			const lostPower = await sweetpadFreezing.getPower(parseEther("10000"), 182);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).sub(lostPower)
			);
			expect((await sweetpadFreezing.stakes(deployer.address, 0)).power).to.equal(
				BigNumber.from(power).sub(lostPower)
			);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.add(parseEther("10000")));
		});

		it("Should unstake fully", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 182);

			const swtBalance = await sweetToken.balanceOf(deployer.address);

			await timeAndMine.mine((await sweetpadFreezing.stakes(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"));

			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(constants.Zero);
			expect((await sweetpadFreezing.stakes(deployer.address, 0)).power).to.equal(constants.Zero);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.add(parseEther("40000")));
		});
	});
});
