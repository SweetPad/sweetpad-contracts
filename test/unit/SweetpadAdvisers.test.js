const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther },
		constants,
		BigNumber
	},
	deployments: { fixture, createFixture },
	timeAndMine
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetpadToken = await getContract("SweetpadToken");
	const sweetpadAdvisers = await getContract("SweetpadAdvisers");
	await sweetpadToken.transfer(sweetpadAdvisers.address, parseEther("9000000"));

	return [sweetpadToken, sweetpadAdvisers];
});

describe("SweetpadAdvisers", function () {
	let deployer, caller, owner, sweetpadToken, sweetpadAdvisers, adminRole;

	before("Before All: ", async function () {
		({ deployer, caller, owner } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadToken, sweetpadAdvisers] = await setupFixture();
		const distributorRole = await sweetpadAdvisers.DISTRIBUTOR();
		adminRole = await sweetpadAdvisers.DEFAULT_ADMIN_ROLE();
		await sweetpadAdvisers.grantRole(distributorRole, deployer.address);
		await sweetpadAdvisers.grantRole(distributorRole, caller.address);
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadAdvisers.sweetToken()).to.equal(sweetpadToken.address);
			expect(await sweetpadAdvisers.hasRole(adminRole, deployer.address)).to.be.true;
		});
	});

	describe("CreateSchedule function: ", function () {
		it("Should create schedule for owner", async function () {
			const availableTokens = await sweetpadAdvisers.availableTokens();
			const tx = await sweetpadAdvisers.createSchedule(owner.address, parseEther("100"), 1000);
			expect(await sweetpadAdvisers.advisersInfo(owner.address)).to.eql([
				BigNumber.from(tx.blockNumber).add(1000),
				parseEther("100")
			]);
			expect(await sweetpadAdvisers.availableTokens()).to.equal(availableTokens.sub(parseEther("100")));
		});

		it("Should revert if address is zero", async function () {
			await expect(
				sweetpadAdvisers.createSchedule(constants.AddressZero, parseEther("100"), 1000)
			).to.be.revertedWith("SweetpadAdvisers: Advisers address can't be zero");
		});

		it("Should revert if amount is zero", async function () {
			await expect(sweetpadAdvisers.createSchedule(deployer.address, constants.Zero, 1000)).to.be.revertedWith(
				"SweetpadAdvisers: Amount can't be zero"
			);
		});

		it("Should revert if caller is not the distributor", async function () {
			await expect(
				sweetpadAdvisers.connect(owner).createSchedule(constants.AddressZero, parseEther("100"), 1000)
			).to.be.revertedWith(
				"AccessControl: account 0x7c3063a500dc6f87308923d04d5272a5b2e74a95 is missing role 0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d"
			);
		});

		it("Should emit ScheduleCreated event with correct args", async function () {
			await expect(sweetpadAdvisers.createSchedule(owner.address, parseEther("100"), 1000))
				.to.emit(sweetpadAdvisers, "ScheduleCreated")
				.withArgs(owner.address, parseEther("100"), 1000);
		});
	});

	describe("claim function: ", function () {
		it("Should claim tokens", async function () {
			const contractBalance = await sweetpadToken.balanceOf(sweetpadAdvisers.address);
			const userBalance = await sweetpadToken.balanceOf(owner.address);
			await sweetpadAdvisers.createSchedule(owner.address, parseEther("100"), 100);
			await timeAndMine.mine(100);
			await sweetpadAdvisers.connect(owner).claim();
			expect(await sweetpadToken.balanceOf(owner.address)).to.equal(userBalance.add(parseEther("100")));
			expect(await sweetpadToken.balanceOf(sweetpadAdvisers.address)).to.equal(
				contractBalance.sub(parseEther("100"))
			);
		});

		it("Should emit Claimed event with correct args", async function () {
			await sweetpadAdvisers.createSchedule(owner.address, parseEther("100"), 100);
			await timeAndMine.mine(100);
			await expect(sweetpadAdvisers.connect(owner).claim())
				.to.emit(sweetpadAdvisers, "Claimed")
				.withArgs(owner.address, parseEther("100"));
		});
		it("Should revert if it's too soon to claim", async function () {
			await sweetpadAdvisers.createSchedule(owner.address, parseEther("100"), 100);
			await expect(sweetpadAdvisers.connect(owner).claim()).to.be.revertedWith(
				"SweetpadAdvisers: Too soon to claim"
			);
		});

		it("Should revert nothing to claim", async function () {
			await expect(sweetpadAdvisers.connect(caller).claim()).to.be.revertedWith(
				"SweetpadAdvisers: Nothing to claim"
			);
		});
	});
});
