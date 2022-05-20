const { expect } = require("chai");
const {
	ethers: { getContract, getNamedSigners, constants },
	deployments: { fixture, createFixture }
} = require("hardhat");

describe("SweetpadNFTFreezing", function () {
	let deployer, caller;
	let sweetpadNFT, sweetpadNFTFreezing;

	const setupFixture = createFixture(async () => {
		await fixture(["", "dev"]);

		const sweetpadNFT = await getContract("SweetpadNFT");
		const sweetpadNFTFreezing = await getContract("SweetpadNFTFreezing", caller);

		await sweetpadNFT.safeMintBatch(deployer.address, [0, 1, 2, 0]);

		return [sweetpadNFT, sweetpadNFTFreezing];
	});

	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadNFT, sweetpadNFTFreezing] = await setupFixture();
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadNFTFreezing.nft()).to.equal(sweetpadNFT.address);
			expect(await sweetpadNFTFreezing.BLOCKS_PER_DAY()).to.equal(28674);
		});
	});

	describe("getTicketsCountForNFT: ", function () {
		it("Should return correct value for every tier", async function () {
			expect(await sweetpadNFTFreezing.getTicketsCountForNFT(1)).to.equal(5);
			expect(await sweetpadNFTFreezing.getTicketsCountForNFT(2)).to.equal(12);
			expect(await sweetpadNFTFreezing.getTicketsCountForNFT(3)).to.equal(30);
			expect(await sweetpadNFTFreezing.getTicketsCountForNFT(4)).to.equal(5);
		});
	});

	describe("setSweetpadNFT: ", function () {
		it("Should revert with 'Ownable: caller is not the owner'", async function () {
			await expect(sweetpadNFTFreezing.setSweetpadNFT(caller.address)).to.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Should revert with 'SweetpadNFTFreezing: NFT contract address can't be 0'", async function () {
			await expect(sweetpadNFTFreezing.connect(deployer).setSweetpadNFT(constants.AddressZero)).to.revertedWith(
				"SweetpadNFTFreezing: NFT contract address can't be 0"
			);
		});

		it("Should set new nft in SweetpadNFTFreezing contract", async function () {
			await sweetpadNFTFreezing.connect(deployer).setSweetpadNFT(caller.address);

			expect(await sweetpadNFTFreezing.nft()).to.eq(caller.address);
		});
	});
});
