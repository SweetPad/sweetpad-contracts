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
	const sweetpadCharity = await getContract("SweetpadCharity");
	await sweetpadToken.transfer(sweetpadCharity.address, parseEther("9000000"));

	return [sweetpadToken, sweetpadCharity];
});

describe("SweetpadCharity", function () {
	let deployer, caller, owner, sweetpadToken, sweetpadCharity, adminRole;

	before("Before All: ", async function () {
		({ deployer, caller, owner } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadToken, sweetpadCharity] = await setupFixture();
		const distributorRole = await sweetpadCharity.DISTRIBUTOR();
		adminRole = await sweetpadCharity.DEFAULT_ADMIN_ROLE();
		await sweetpadCharity.grantRole(distributorRole, deployer.address);
		await sweetpadCharity.grantRole(distributorRole, caller.address);
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadCharity.sweetToken()).to.equal(sweetpadToken.address);
			expect(await sweetpadCharity.hasRole(adminRole, deployer.address)).to.be.true;
		});
	});

	describe("CreateSchedule function: ", function () {
		it("Should create schedule for owner", async function () {
			const availableTokens = await sweetpadCharity.availableTokens();
			const tx = await sweetpadCharity.createSchedule(owner.address, parseEther("100"), 1000);
			expect(await sweetpadCharity.userInfo(owner.address)).to.eql([
				BigNumber.from(tx.blockNumber).add(1000),
				parseEther("100")
			]);
			expect(await sweetpadCharity.availableTokens()).to.equal(availableTokens.sub(parseEther("100")));
		});

		it("Should revert if address is zero", async function () {
			await expect(
				sweetpadCharity.createSchedule(constants.AddressZero, parseEther("100"), 1000)
			).to.be.revertedWith("SweetpadCharity: User address can't be zero");
		});

		it("Should revert if amount is zero", async function () {
			await expect(sweetpadCharity.createSchedule(deployer.address, constants.Zero, 1000)).to.be.revertedWith(
				"SweetpadCharity: Amount can't be zero"
			);
		});

		it("Should revert if caller is not the distributor", async function () {
			await expect(
				sweetpadCharity.connect(owner).createSchedule(constants.AddressZero, parseEther("100"), 1000)
			).to.be.revertedWith(
				"AccessControl: account 0x7c3063a500dc6f87308923d04d5272a5b2e74a95 is missing role 0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d"
			);
		});

		it("Should emit ScheduleCreated event with correct args", async function () {
			await expect(sweetpadCharity.createSchedule(owner.address, parseEther("100"), 1000))
				.to.emit(sweetpadCharity, "ScheduleCreated")
				.withArgs(owner.address, parseEther("100"), 1000);
		});
	});

	describe("claim function: ", function () {
		it("Should claim tokens", async function () {
			const contractBalance = await sweetpadToken.balanceOf(sweetpadCharity.address);
			const userBalance = await sweetpadToken.balanceOf(owner.address);
			await sweetpadCharity.createSchedule(owner.address, parseEther("100"), 100);
			await timeAndMine.mine(100);
			await sweetpadCharity.connect(owner).claim();
			expect(await sweetpadToken.balanceOf(owner.address)).to.equal(userBalance.add(parseEther("100")));
			expect(await sweetpadToken.balanceOf(sweetpadCharity.address)).to.equal(
				contractBalance.sub(parseEther("100"))
			);
		});

		it("Should emit Claimed event with correct args", async function () {
			await sweetpadCharity.createSchedule(owner.address, parseEther("100"), 100);
			await timeAndMine.mine(100);
			await expect(sweetpadCharity.connect(owner).claim())
				.to.emit(sweetpadCharity, "Claimed")
				.withArgs(owner.address, parseEther("100"));
		});
		it("Should revert if it's too soon to claim", async function () {
			await sweetpadCharity.createSchedule(owner.address, parseEther("100"), 100);
			await expect(sweetpadCharity.connect(owner).claim()).to.be.revertedWith(
				"SweetpadCharity: Too soon to claim"
			);
		});

		it("Should revert nothing to claim", async function () {
			await expect(sweetpadCharity.connect(caller).claim()).to.be.revertedWith(
				"SweetpadCharity: Nothing to claim"
			);
		});
	});
});
