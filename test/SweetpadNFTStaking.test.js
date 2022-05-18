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
	let sweetpadNFT, sweetpadNFTStaking;

	const setupFixture = createFixture(async () => {
		await fixture(["", "dev"]);
	
		const sweetpadNFT = await getContract("SweetpadNFT");
		const sweetpadNFTStaking = await getContract("SweetpadNFTStaking", caller);
	
		await sweetpadNFT.safeMintBatch(deployer.address, [0, 1, 2, 0]);
	
		return [sweetpadNFT, sweetpadNFTStaking];
	});

	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadNFT, sweetpadNFTStaking] = await setupFixture();
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadNFTStaking.nft()).to.equal(sweetpadNFT.address);
		});
	});

	describe("getTicketsCountForNFT: ", function () {
		it("Should return correct value for every tier", async function () {
			expect(await sweetpadNFTStaking.getTicketsCountForNFT(1)).to.equal(5);
			expect(await sweetpadNFTStaking.getTicketsCountForNFT(2)).to.equal(12);
			expect(await sweetpadNFTStaking.getTicketsCountForNFT(3)).to.equal(30);
			expect(await sweetpadNFTStaking.getTicketsCountForNFT(4)).to.equal(5);
		});
	});
});