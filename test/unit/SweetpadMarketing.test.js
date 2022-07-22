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
	const sweetpadMarketing = await getContract("SweetpadMarketing");
	await sweetpadToken.transfer(sweetpadMarketing.address, parseEther("9000000"));

	return [sweetpadToken, sweetpadMarketing];
});

describe("SweetpadMarketing", function () {
	let deployer, caller, owner, sweetpadToken, sweetpadMarketing, adminRole;

	before("Before All: ", async function () {
		({ deployer, caller, owner } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadToken, sweetpadMarketing] = await setupFixture();
		// blocksPerMonth = await sweetpadTeamTokenomics.BLOCKS_PER_MONTH();
		// blockNumber = await ethers.provider.getBlockNumber();
		const distributorRole = await sweetpadMarketing.DISTRIBUTOR();
		adminRole = await sweetpadMarketing.DEFAULT_ADMIN_ROLE();
		await sweetpadMarketing.grantRole(distributorRole, deployer.address);
		await sweetpadMarketing.grantRole(distributorRole, caller.address);
		// await timeAndMine.mine(300);
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadMarketing.sweetToken()).to.equal(sweetpadToken.address);
			expect(await sweetpadMarketing.hasRole(adminRole, deployer.address)).to.be.true;
		});
	});

	describe("CreateSchedule function: ", function () {
		it("Should create schedule for owner", async function () {
			const availableTokens = await sweetpadMarketing.availableTokens();
			const tx = await sweetpadMarketing.createSchedule(owner.address, parseEther("100"), 1000);
			expect(await sweetpadMarketing.userInfo(owner.address)).to.eql([
				BigNumber.from(tx.blockNumber).add(1000),
				parseEther("100")
			]);
			expect(await sweetpadMarketing.availableTokens()).to.equal(availableTokens.sub(parseEther("100")));
		});

		it("Should revert if address is zero", async function () {
			await expect(
				sweetpadMarketing.createSchedule(constants.AddressZero, parseEther("100"), 1000)
			).to.be.revertedWith("SweetpadMarketing: User address can't be zero");
		});

		it("Should revert if amount is zero", async function () {
			await expect(sweetpadMarketing.createSchedule(deployer.address, constants.Zero, 1000)).to.be.revertedWith(
				"SweetpadMarketing: Amount can't be zero"
			);
		});

		it("Should revert if caller is not the distributor", async function () {
			await expect(
				sweetpadMarketing.connect(owner).createSchedule(constants.AddressZero, parseEther("100"), 1000)
			).to.be.revertedWith(
				"AccessControl: account 0x7c3063a500dc6f87308923d04d5272a5b2e74a95 is missing role 0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d"
			);
		});

		it("Should emit ScheduleCreated event with correct args", async function () {
			await expect(sweetpadMarketing.createSchedule(owner.address, parseEther("100"), 1000))
				.to.emit(sweetpadMarketing, "ScheduleCreated")
				.withArgs(owner.address, parseEther("100"), 1000);
		});
	});

	describe("claim function: ", function () {
		it("Should claim tokens", async function () {
			const contractBalance = await sweetpadToken.balanceOf(sweetpadMarketing.address);
			const userBalance = await sweetpadToken.balanceOf(owner.address);
			await sweetpadMarketing.createSchedule(owner.address, parseEther("100"), 100);
			await timeAndMine.mine(100);
			await sweetpadMarketing.connect(owner).claim();
			expect(await sweetpadToken.balanceOf(owner.address)).to.equal(userBalance.add(parseEther("100")));
			expect(await sweetpadToken.balanceOf(sweetpadMarketing.address)).to.equal(
				contractBalance.sub(parseEther("100"))
			);
		});

		it("Should emit Claimed event with correct args", async function () {
			await sweetpadMarketing.createSchedule(owner.address, parseEther("100"), 100);
			await timeAndMine.mine(100);
			await expect(sweetpadMarketing.connect(owner).claim())
				.to.emit(sweetpadMarketing, "Claimed")
				.withArgs(owner.address, parseEther("100"));
		});
		it("Should revert if it's too soon to claim", async function () {
			await sweetpadMarketing.createSchedule(owner.address, parseEther("100"), 100);
			await expect(sweetpadMarketing.connect(owner).claim()).to.be.revertedWith(
				"SweetpadMarketing: Too soon to claim"
			);
		});

		it("Should revert nothing to claim", async function () {
			await expect(sweetpadMarketing.connect(caller).claim()).to.be.revertedWith(
				"SweetpadMarketing: Nothing to claim"
			);
		});
	});
});
