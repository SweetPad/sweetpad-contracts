const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther },
		constants,
		BigNumber
	},
	ethers,
	deployments: { fixture, createFixture },
	timeAndMine
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetpadToken = await getContract("SweetpadToken");
	const sweetpadTeamTokenomics = await getContract("SweetpadTeamTokenomics");
	await sweetpadToken.transfer(sweetpadTeamTokenomics.address, parseEther("19000000"));

	return [sweetpadToken, sweetpadTeamTokenomics];
});

describe("SweetpadTeamTokenomics", function () {
	let deployer, caller, owner, sweetpadToken, sweetpadTeamTokenomics, blocksPerMonth, blockNumber, unlockedAmount;

	before("Before All: ", async function () {
		({ deployer, caller, owner } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadToken, sweetpadTeamTokenomics] = await setupFixture();
		blocksPerMonth = await sweetpadTeamTokenomics.BLOCKS_PER_MONTH();
		blockNumber = await ethers.provider.getBlockNumber();
		unlockedAmount = parseEther("1600000");
		const distributorRole = await sweetpadTeamTokenomics.DISTRIBUTOR();
		await sweetpadTeamTokenomics.grantRole(distributorRole, deployer.address);
		await sweetpadTeamTokenomics.grantRole(distributorRole, caller.address);
		await timeAndMine.mine(300);
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadTeamTokenomics.startBlock()).to.equal(
				BigNumber.from(blockNumber - 1).add(BigNumber.from(300))
			);
			expect(await sweetpadTeamTokenomics.sweetToken()).to.equal(sweetpadToken.address);
		});
	});

	describe("claim function: ", function () {
		it("Should claim given amount of tokens", async function () {
			const lockedTokens = await sweetpadTeamTokenomics.lockedTokens();
			const claimedTokens = await sweetpadTeamTokenomics.claimedTokens();
			const balance = await sweetpadToken.balanceOf(sweetpadTeamTokenomics.address);
			for (let i = 0; i < 11; i++) {
				await timeAndMine.mine(blocksPerMonth);
				await sweetpadTeamTokenomics.claim(unlockedAmount);
				expect(await sweetpadTeamTokenomics.unlockedTokens()).to.equal(constants.Zero);
				expect(await sweetpadTeamTokenomics.lockedTokens()).to.equal(
					lockedTokens.sub(unlockedAmount.mul(i + 1))
				);
				expect(await sweetpadTeamTokenomics.claimedTokens()).to.equal(
					claimedTokens.add(unlockedAmount.mul(i + 1))
				);
				expect(await sweetpadToken.balanceOf(sweetpadTeamTokenomics.address)).to.equal(
					balance.sub(unlockedAmount.mul(i + 1))
				);
			}
			await timeAndMine.mine(blocksPerMonth);
			await sweetpadTeamTokenomics.claim(parseEther("1400000"));
			expect(await sweetpadTeamTokenomics.unlockedTokens()).to.equal(constants.Zero);
			expect(await sweetpadTeamTokenomics.lockedTokens()).to.equal(constants.Zero);
			expect(await sweetpadTeamTokenomics.claimedTokens()).to.equal(claimedTokens.add(parseEther("19000000")));
			expect(await sweetpadToken.balanceOf(sweetpadTeamTokenomics.address)).to.equal(constants.Zero);
		});

		it("Should claim part of tokens", async function () {
			const lockedTokens = await sweetpadTeamTokenomics.lockedTokens();
			const claimedTokens = await sweetpadTeamTokenomics.claimedTokens();
			const balance = await sweetpadToken.balanceOf(sweetpadTeamTokenomics.address);
			await timeAndMine.mine(blocksPerMonth);
			await sweetpadTeamTokenomics.connect(caller).claim(parseEther("1400000"));
			expect(await sweetpadTeamTokenomics.unlockedTokens()).to.equal(parseEther("200000"));
			expect(await sweetpadTeamTokenomics.lockedTokens()).to.equal(lockedTokens.sub(unlockedAmount));
			expect(await sweetpadTeamTokenomics.claimedTokens()).to.equal(claimedTokens.add(parseEther("1400000")));
			expect(await sweetpadToken.balanceOf(sweetpadTeamTokenomics.address)).to.equal(
				balance.sub(parseEther("1400000"))
			);
		});

		it("Should claim after 2 months", async function () {
			const lockedTokens = await sweetpadTeamTokenomics.lockedTokens();
			const claimedTokens = await sweetpadTeamTokenomics.claimedTokens();
			const balance = await sweetpadToken.balanceOf(sweetpadTeamTokenomics.address);
			await timeAndMine.mine(blocksPerMonth * 2);
			await sweetpadTeamTokenomics.connect(caller).claim(parseEther("1400000"));
			expect(await sweetpadTeamTokenomics.unlockedTokens()).to.equal(parseEther("1800000"));
			expect(await sweetpadTeamTokenomics.lockedTokens()).to.equal(lockedTokens.sub(parseEther("3200000")));
			expect(await sweetpadTeamTokenomics.claimedTokens()).to.equal(claimedTokens.add(parseEther("1400000")));
			expect(await sweetpadToken.balanceOf(sweetpadTeamTokenomics.address)).to.equal(
				balance.sub(parseEther("1400000"))
			);
		});

		it("Should revert if caller isn't distributor", async function () {
			await expect(sweetpadTeamTokenomics.connect(owner).claim(parseEther("1400000"))).to.be.revertedWith(
				"AccessControl: account 0x7c3063a500dc6f87308923d04d5272a5b2e74a95 is missing role 0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d"
			);
		});

		it("Should revert if it's too soon to claim", async function () {
			await expect(sweetpadTeamTokenomics.connect(caller).claim(parseEther("1400000"))).to.be.revertedWith(
				"SweetpadTeamTokenomics: Too soon to claim"
			);
		});

		it("Should revert if tokens are insufficient", async function () {
			await timeAndMine.mine(blocksPerMonth);
			await expect(sweetpadTeamTokenomics.connect(caller).claim(parseEther("2400000"))).to.be.revertedWith(
				"SweetpadTeamTokenomics: Insufficient unlocked tokens"
			);
		});
	});
});
