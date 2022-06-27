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
	const lpToken = await getContract("lpToken");
	const sweetpadFreezing = await getContract("SweetpadFreezing");

	return [sweetpadFreezing, sweetToken, lpToken];
});

describe("SweetpadFreezing", function () {
	let deployer, caller, sweetpadFreezing, sweetToken, lpToken, minPeriod, maxPeriod;

	const daysToBlocks = async (days) => {
		return (await sweetpadFreezing.getBlocksPerDay()).mul(days);
	};

	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadFreezing, sweetToken, lpToken] = await setupFixture();
		minPeriod = await daysToBlocks(5);
		maxPeriod = await daysToBlocks(30);
		await sweetpadFreezing.setMultiplier(250);
		await sweetpadFreezing.setLPToken(lpToken.address);
		await sweetToken.connect(deployer).transfer(caller.address, parseEther("15000"));
		await lpToken.connect(deployer).transfer(caller.address, parseEther("15000"));
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadFreezing.sweetToken()).to.equal(sweetToken.address);
			expect(await sweetpadFreezing.getBlocksPerDay()).to.equal(1);
			expect(await sweetpadFreezing.getMinFreezePeriod()).to.equal(
				(await sweetpadFreezing.getBlocksPerDay()).mul(5)
			);
			expect(await sweetpadFreezing.getMaxFreezePeriod()).to.equal(
				(await sweetpadFreezing.getBlocksPerDay()).mul(30)
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
			await expect(sweetpadFreezing.connect(caller).freezeSWT(parseEther("15000"), minPeriod)).to.be.revertedWith(
				"SweetpadFreezing: At least 10.000 xSWT is required"
			);
		});

		it("Should freeze with min period, then freeze again", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			let freezeTX = await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), minPeriod);
			let lockedPeriod = BigNumber.from(freezeTX.blockNumber).add(BigNumber.from(minPeriod));
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(parseEther("10000"));
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 0)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from(minPeriod),
				parseEther("20000"),
				parseEther("10000"),
				0
			]);
			expect(await sweetpadFreezing.totalFrozenSWT()).to.equal(parseEther("20000"));
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);
			freezeTX = await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), maxPeriod);
			lockedPeriod = BigNumber.from(freezeTX.blockNumber).add(BigNumber.from(maxPeriod));

			expect((await sweetpadFreezing.getFreezes(deployer.address)).length).to.equal(2);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).add(parseEther("40000"))
			);
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 1)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from(maxPeriod),
				parseEther("20000"),
				parseEther("40000"),
				0
			]);
			expect(await sweetpadFreezing.totalFrozenSWT()).to.equal(parseEther("40000"));
		});

		it("Should transfer SWT correctly", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			const period = minPeriod;
			await expect(() =>
				sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), period)
			).to.changeTokenBalances(
				sweetToken,
				[deployer, sweetpadFreezing],
				[parseEther("40000").mul(constants.NegativeOne), parseEther("40000")]
			);
		});

		it("Should emit Freeze event with correct args", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("20000"));
			await expect(sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), minPeriod))
				.to.emit(sweetpadFreezing, "Freeze")
				.withArgs(
					(await sweetpadFreezing.getFreezes(deployer.address)).length - 1,
					deployer.address,
					parseEther("20000"),
					parseEther("10000"),
					0
				);
		});
	});

	describe("UnfreezeSWT function", function () {
		it("Should revert with 'SweetpadFreezing: At least 10.000 xSWT is required'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), minPeriod);

			await timeAndMine.mine(minPeriod);

			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("30000"))).to.be.revertedWith(
				"SweetpadFreezing: At least 10.000 xSWT is required"
			);
		});

		it("Should revert with 'SweetpadFreezing: Frozen amount is Zero'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), minPeriod);

			await timeAndMine.mine(minPeriod);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"));
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"))).to.be.revertedWith(
				"SweetpadFreezing: Frozen amount is Zero"
			);
		});

		it("Should revert with 'SweetpadFreezing: Insufficient frozen amount'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), minPeriod);

			await timeAndMine.mine(minPeriod);

			await sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("20000"));
			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"))).to.be.revertedWith(
				"SweetpadFreezing: Insufficient frozen amount"
			);
		});

		it("Should revert with 'SweetpadFreezing: Locked period dosn`t pass'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), minPeriod);

			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"))).to.be.revertedWith(
				"SweetpadFreezing: Locked period dosn`t pass"
			);
		});

		it("Should revert with 'SweetpadFreezing: Wrong ID'", async function () {
			await lpToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeLP(parseEther("40000"), minPeriod);

			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"))).to.be.revertedWith(
				"SweetpadFreezing: Wrong ID"
			);
		});

		it("Should unFreeze partial", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), minPeriod);
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);
			expect(await sweetpadFreezing.totalFrozenSWT()).to.equal(parseEther("40000"));

			await timeAndMine.mine(minPeriod);

			await expect(() =>
				sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("10000"))
			).to.changeTokenBalances(
				sweetToken,
				[sweetpadFreezing, deployer],
				[parseEther("10000").mul(constants.NegativeOne), parseEther("10000")]
			);
			const lostPower = await sweetpadFreezing.getPower(parseEther("10000"), minPeriod);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).sub(lostPower)
			);
			expect(await sweetpadFreezing.totalFrozenSWT()).to.equal(parseEther("30000"));
		});

		it("Should unFreeze fully", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), minPeriod);

			await timeAndMine.mine(minPeriod);

			await expect(() =>
				sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("40000"))
			).to.changeTokenBalances(
				sweetToken,
				[sweetpadFreezing, deployer],
				[parseEther("40000").mul(constants.NegativeOne), parseEther("40000")]
			);

			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(constants.Zero);
		});

		it("Should emit UnFreeze event with correct args", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("20000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("20000"), minPeriod);

			await timeAndMine.mine(minPeriod);

			await expect(sweetpadFreezing.connect(deployer).unfreezeSWT(0, parseEther("20000")))
				.to.emit(sweetpadFreezing, "UnFreeze")
				.withArgs(0, deployer.address, parseEther("20000"), 0);
		});
	});

	describe("FreezeLP function", function () {
		it("Should revert with 'SweetpadFreezing: Wrong period'", async function () {
			await expect(
				sweetpadFreezing.connect(deployer).freezeLP(parseEther("10000"), await daysToBlocks(181))
			).to.be.revertedWith("SweetpadFreezing: Wrong period");
			await expect(
				sweetpadFreezing.connect(deployer).freezeLP(parseEther("10000"), await daysToBlocks(1100))
			).to.be.revertedWith("SweetpadFreezing: Wrong period");
		});

		it("Should revert with 'SweetpadFreezing: At least 10.000 xSWT is required'", async function () {
			await expect(sweetpadFreezing.connect(caller).freezeLP(parseEther("4900"), minPeriod)).to.be.revertedWith(
				"SweetpadFreezing: At least 10.000 xSWT is required"
			);
		});

		it("Should freeze with min period, then freeze again", async function () {
			await lpToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			let freezeTX = await sweetpadFreezing.connect(deployer).freezeLP(parseEther("20000"), minPeriod);
			let lockedPeriod = BigNumber.from(freezeTX.blockNumber).add(minPeriod);
			expect(await sweetpadFreezing.totalFrozenLP()).to.equal(parseEther("20000"));
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				parseEther("10000")
					.mul(await sweetpadFreezing.multiplier())
					.div(100)
			);
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 0)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from(minPeriod),
				parseEther("20000"),
				parseEther("25000"),
				1
			]);
			const totalPower = await sweetpadFreezing.totalPower(deployer.address);
			freezeTX = await sweetpadFreezing.connect(deployer).freezeLP(parseEther("20000"), maxPeriod);
			lockedPeriod = BigNumber.from(freezeTX.blockNumber).add(BigNumber.from(maxPeriod));

			expect(await sweetpadFreezing.totalFrozenLP()).to.equal(parseEther("40000"));
			expect((await sweetpadFreezing.getFreezes(deployer.address)).length).to.equal(2);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(
				BigNumber.from(totalPower).add(
					parseEther("40000")
						.mul(await sweetpadFreezing.multiplier())
						.div(100)
				)
			);
			expect(await sweetpadFreezing.freezeInfo(deployer.address, 1)).to.eql([
				BigNumber.from(lockedPeriod),
				BigNumber.from(maxPeriod),
				parseEther("20000"),
				parseEther("100000"),
				1
			]);
		});

		it("Should transfer LP correctly", async function () {
			await lpToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			const period = minPeriod;
			await expect(() =>
				sweetpadFreezing.connect(deployer).freezeLP(parseEther("40000"), period)
			).to.changeTokenBalances(
				lpToken,
				[deployer, sweetpadFreezing],
				[parseEther("40000").mul(constants.NegativeOne), parseEther("40000")]
			);
		});

		it("Should emit Freeze event with correct args", async function () {
			await lpToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("20000"));
			await expect(sweetpadFreezing.connect(deployer).freezeLP(parseEther("20000"), minPeriod))
				.to.emit(sweetpadFreezing, "Freeze")
				.withArgs(
					(await sweetpadFreezing.getFreezes(deployer.address)).length - 1,
					deployer.address,
					parseEther("20000"),
					parseEther("10000")
						.mul(await sweetpadFreezing.multiplier())
						.div(100),
					1
				);
		});
	});

	describe("UnfreezeLP function", function () {
		it("Should revert with 'SweetpadFreezing: Locked period dosn`t pass'", async function () {
			await lpToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeLP(parseEther("40000"), minPeriod);

			await expect(sweetpadFreezing.connect(deployer).unfreezeLP(0)).to.be.revertedWith(
				"SweetpadFreezing: Locked period dosn`t pass"
			);
		});

		it("Should revert with 'SweetpadFreezing: Wrong ID'", async function () {
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), minPeriod);

			await expect(sweetpadFreezing.connect(deployer).unfreezeLP(0)).to.be.revertedWith(
				"SweetpadFreezing: Wrong ID"
			);
		});

		it("Should unFreeze", async function () {
			await lpToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetpadFreezing.connect(deployer).freezeLP(parseEther("40000"), minPeriod);
			expect(await sweetpadFreezing.totalFrozenLP()).to.equal(parseEther("40000"));

			await timeAndMine.mine(minPeriod);

			await expect(() => sweetpadFreezing.connect(deployer).unfreezeLP(0)).to.changeTokenBalances(
				lpToken,
				[sweetpadFreezing, deployer],
				[parseEther("40000").mul(constants.NegativeOne), parseEther("40000")]
			);

			expect(await sweetpadFreezing.totalFrozenLP()).to.equal(constants.Zero);
			expect(await sweetpadFreezing.totalPower(deployer.address)).to.equal(constants.Zero);
		});

		it("Should emit UnFreeze event with correct args", async function () {
			await lpToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("20000"));
			await sweetpadFreezing.connect(deployer).freezeLP(parseEther("20000"), minPeriod);

			await timeAndMine.mine(minPeriod);

			await expect(sweetpadFreezing.connect(deployer).unfreezeLP(0))
				.to.emit(sweetpadFreezing, "UnFreeze")
				.withArgs(0, deployer.address, parseEther("20000"), 1);
		});
	});

	describe("SetMultiplier function", function () {
		it("Can call only admin", async function () {
			await expect(sweetpadFreezing.connect(caller).setMultiplier(100)).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Should revert with: 'SweetpadFreezing: Multiplier can't be zero'", async function () {
			await expect(sweetpadFreezing.setMultiplier(0)).to.be.revertedWith(
				"SweetpadFreezing: Multiplier can't be zero"
			);
		});

		it("Should set multiplier", async function () {
			await sweetpadFreezing.setMultiplier(150);
			expect(await sweetpadFreezing.multiplier()).to.equal(150);
		});
	});
});
