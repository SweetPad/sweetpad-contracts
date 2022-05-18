const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
	},
	deployments: { fixture, createFixture }
} = require("hardhat");

describe("SweetpadNFTStaking", function () {
	let deployer, caller;
	let sweetNFT, sweetNFTStaking;

	const setupFixture = createFixture(async () => {
		await fixture(["", "dev"]);
	
		const sweetNFT = await getContract("SweetpadNFT");
		const sweetNFTStaking = await getContract("SweetpadNFTStaking", caller);
	
		await sweetNFT.safeMintBatch(deployer.address, [0, 1, 2, 0]);
	
		return [sweetNFT, sweetNFTStaking];
	});

	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetNFT, sweetNFTStaking] = await setupFixture();
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetNFTStaking.nft()).to.equal(sweetNFT.address);
		});
	});

	describe("getTicketsCountForNFT: ", function () {
		it("Should return correct value for every tier", async function () {
			expect(await sweetNFTStaking.getTicketsCountForNFT(1)).to.equal(5);
			expect(await sweetNFTStaking.getTicketsCountForNFT(2)).to.equal(12);
			expect(await sweetNFTStaking.getTicketsCountForNFT(3)).to.equal(30);
			expect(await sweetNFTStaking.getTicketsCountForNFT(4)).to.equal(5);
		});
	});
});