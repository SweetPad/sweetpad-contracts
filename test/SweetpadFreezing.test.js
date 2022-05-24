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
			await expect(sweetpadFreezing.connect(deployer).freezeSWT(parseEther("10000"), 1810)).to.be.revertedWith(
				"SweetpadFreezing: Wrong period"
			);
			await expect(sweetpadFreezing.connect(deployer).freezeSWT(parseEther("10000"), 11000)).to.be.revertedWith(
				"SweetpadFreezing: Wrong period"
			);
		});

		it("Should revert with 'SweetpadFreezing: At least 10.000 xSWT is required'", async function () {
			await expect(sweetpadFreezing.connect(caller).freezeSWT(parseEther("15000"), 1820)).to.be.revertedWith(
				"SweetpadFreezing: At least 10.000 xSWT is required"
			);
		});

		it("Should stake with min period, than stake again", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			const swtBalance = await sweetToken.balanceOf(deployer.address);
			let stakeTX = await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), 1820);
			let lockedPeriod = BigNumber.from(stakeTX.blockNumber).add(
				BigNumber.from(182).mul(await sweetpadFreezing.BLOCKS_PER_DAY())
			);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(parseEther("10000"));
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 0)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from("1820"),
				parseEther("20000"),
				parseEther("10000")
			]);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.sub(parseEther("20000")));
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);
			stakeTX = await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), 10950);
			lockedPeriod = BigNumber.from(stakeTX.blockNumber).add(
				BigNumber.from(1095).mul(await sweetpadFreezing.BLOCKS_PER_DAY())
			);

			expect((await sweetpadFreezing.getFreezes(deployer.address)).length).to.equal(2);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).add(parseEther("40000"))
			);
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 1)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from("10950"),
				parseEther("20000"),
				parseEther("40000")
			]);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.sub(parseEther("40000")));
		});
	});

	describe("UnfreezeSWT function", function () {
		it("Should revert with 'SweetpadFreezing: At least 10.000 xSWT is required'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 1820);
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("30000"))).to.be.revertedWith(
				"SweetpadFreezing: At least 10.000 xSWT is required"
			);
		});

		it("Should revert with 'SweetpadFreezing: Staked amount is Zero'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 1820);

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"));
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"))).to.be.revertedWith(
				"SweetpadFreezing: Staked amount is Zero"
			);
		});

		it("Should revert with 'SweetpadFreezing: Insufficient staked amount'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 1820);

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("20000"));
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"))).to.be.revertedWith(
				"SweetpadFreezing: Insufficient staked amount"
			);
		});

		it("Should revert with 'SweetpadFreezing: Locked period dosn`t pass'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 1820);

			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"))).to.be.revertedWith(
				"SweetpadFreezing: Locked period dosn`t pass"
			);
		});

		it("Should unstake partial", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 1820);
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);
			const power = (await sweetpadFreezing.freezeInfo(deployer.address, 0)).power;

			const swtBalance = await sweetToken.balanceOf(deployer.address);

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"));
			const lostPower = await sweetpadFreezing.getPower(parseEther("10000"), 1820);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).sub(lostPower)
			);
			expect((await sweetpadFreezing.freezeInfo(deployer.address, 0)).power).to.equal(
				BigNumber.from(power).sub(lostPower)
			);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.add(parseEther("10000")));
		});

		it("Should unstake fully", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), 1820);

			const swtBalance = await sweetToken.balanceOf(deployer.address);

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"));

			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(constants.Zero);
			expect((await sweetpadFreezing.freezeInfo(deployer.address, 0)).power).to.equal(constants.Zero);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.add(parseEther("40000")));
		});
	});
});