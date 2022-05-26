const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther },
		BigNumber,
		constants
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

	const daysToBlocks = async (days) => {
		return (await sweetpadFreezing.getBlocksPerDay()).mul(days);
	};

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
			expect(await sweetpadFreezing.getBlocksPerDay()).to.equal(10);
			expect(await sweetpadFreezing.getMinFreezePeriod()).to.equal(
				(await sweetpadFreezing.getBlocksPerDay()).mul(182)
			);
			expect(await sweetpadFreezing.getMaxFreezePeriod()).to.equal(
				(await sweetpadFreezing.getBlocksPerDay()).mul(1095)
			);
		});
	});

	describe("FreezeSWT function", function () {
		it("Should revert with 'SweetpadFreezing: Wrong period'", async function () {
			await expect(
				sweetpadFreezing.connect(deployer).freezeSWT(parseEther("10000"), await daysToBlocks(181))
			).to.be.revertedWith("SweetpadFreezing: Wrong period");
			await expect(
				sweetpadFreezing.connect(deployer).freezeSWT(parseEther("10000"), await daysToBlocks(1100))
			).to.be.revertedWith("SweetpadFreezing: Wrong period");
		});

		it("Should revert with 'SweetpadFreezing: At least 10.000 xSWT is required'", async function () {
			await expect(
				sweetpadFreezing.connect(caller).freezeSWT(parseEther("15000"), await daysToBlocks(182))
			).to.be.revertedWith("SweetpadFreezing: At least 10.000 xSWT is required");
		});

		it("Should freeze with min period, then freeze again", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			const swtBalance = await sweetToken.balanceOf(deployer.address);
			let freezeTX = await sweetpadFreezing
				.connect(deployer)
				.freezeSWT(parseEther("20000"), await daysToBlocks(182));
			let lockedPeriod = BigNumber.from(freezeTX.blockNumber).add(BigNumber.from(await daysToBlocks(182)));
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(parseEther("10000"));
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 0)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from(await daysToBlocks(182)),
				parseEther("20000")
			]);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.sub(parseEther("20000")));
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);
			freezeTX = await sweetpadFreezing
				.connect(deployer)
				.freezeSWT(parseEther("20000"), await daysToBlocks(1095));
			lockedPeriod = BigNumber.from(freezeTX.blockNumber).add(BigNumber.from(await daysToBlocks(1095)));

			expect((await sweetpadFreezing.getFreezes(deployer.address)).length).to.equal(2);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).add(parseEther("40000"))
			);
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 1)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from(await daysToBlocks(1095)),
				parseEther("20000")
			]);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.sub(parseEther("40000")));
		});

		it("Should emit Freeze event with correct args", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("20000"));
			await expect(sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), await daysToBlocks(182)))
				.to.emit(sweetpadFreezing, "Freeze")
				.withArgs((await sweetpadFreezing.getFreezes(deployer.address)).length - 1, deployer.address, parseEther("20000"), parseEther("10000"));
		});
	});

	describe("UnfreezeSWT function", function () {
		it("Should revert with 'SweetpadFreezing: At least 10.000 xSWT is required'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), await daysToBlocks(182));

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("30000"))).to.be.revertedWith(
				"SweetpadFreezing: At least 10.000 xSWT is required"
			);
		});

		it("Should revert with 'SweetpadFreezing: Frozen amount is Zero'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), await daysToBlocks(182));

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"));
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"))).to.be.revertedWith(
				"SweetpadFreezing: Frozen amount is Zero"
			);
		});

		it("Should revert with 'SweetpadFreezing: Insufficient frozen amount'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), await daysToBlocks(182));

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("20000"));
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"))).to.be.revertedWith(
				"SweetpadFreezing: Insufficient frozen amount"
			);
		});

		it("Should revert with 'SweetpadFreezing: Locked period dosn`t pass'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), await daysToBlocks(182));

			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"))).to.be.revertedWith(
				"SweetpadFreezing: Locked period dosn`t pass"
			);
		});

		it("Should unFreeze partial", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), await daysToBlocks(182));
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);

			const swtBalance = await sweetToken.balanceOf(deployer.address);

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"));
			const lostPower = await sweetpadFreezing.getPower(parseEther("10000"), await daysToBlocks(182));
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).sub(lostPower)
			);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.add(parseEther("10000")));
		});

		it("Should unFreeze fully", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), await daysToBlocks(182));

			const swtBalance = await sweetToken.balanceOf(deployer.address);

			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"));

			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(constants.Zero);
			expect(await sweetToken.balanceOf(deployer.address)).to.equal(swtBalance.add(parseEther("40000")));
		});

		it("Should emit UnFreeze event with correct args", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("20000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), await daysToBlocks(182));
			await timeAndMine.mine((await sweetpadFreezing.freezeInfo(deployer.address, 0)).frozenUntil);
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("20000")))
				.to.emit(sweetpadFreezing, "UnFreeze")
				.withArgs(0, deployer.address, parseEther("20000"));
		});
	});
});
