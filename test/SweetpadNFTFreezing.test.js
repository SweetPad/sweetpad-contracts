const { expect } = require("chai");
const {
	ethers: { getContract, getNamedSigners, constants, provider, BigNumber },
	deployments: { fixture, createFixture },
	waffle
} = require("hardhat");
const sweetpadTicketJson = require("../artifacts/contracts/interfaces/ISweetpadTicket.sol/ISweetpadTicket.json");

describe("SweetpadNFTFreezing", function () {
	let deployer, caller;
	let sweetpadNFT, sweetpadTicket, sweetpadNFTFreezing;

	const setupFixture = createFixture(async () => {
		await fixture(["", "dev"]);

		const sweetpadNFT = await getContract("SweetpadNFT");
		const sweetpadNFTFreezing = await getContract("SweetpadNFTFreezing", caller);
		const sweetpadTicket = await waffle.deployMockContract(deployer, sweetpadTicketJson.abi);
		await sweetpadTicket.mock.mint.returns(true);

		await sweetpadNFT.safeMintBatch(caller.address, [0, 1, 2, 0]);
		sweetpadNFTFreezing.connect(deployer).setSweetpadTicket(sweetpadTicket.address);

		return [sweetpadNFT, sweetpadTicket, sweetpadNFTFreezing];
	});

	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadNFT, sweetpadTicket, sweetpadNFTFreezing] = await setupFixture();
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadNFTFreezing.nft()).to.equal(sweetpadNFT.address);
			expect(await sweetpadNFTFreezing.blocksPerDay()).to.equal(28674);
		});
	});

	describe("freeze: ", function () {
		it("Should revert with 'ERC721: transfer caller is not owner nor approved'", async function () {
			await expect(sweetpadNFTFreezing.connect(deployer).freeze(1, 182)).to.revertedWith(
				"ERC721: transfer caller is not owner nor approved"
			);
		});

		it("Should revert with 'SweetpadNFTFreezing: Freeze period must be greater than 182 days'", async function () {
			await expect(sweetpadNFTFreezing.freeze(1, 181)).to.revertedWith(
				"SweetpadNFTFreezing: Freeze period must be greater than 182 days"
			);
		});

		it("Should freeze nft in SweetpadNFTFreezing contract (182 days)", async function () {
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 1);
			const tx = await sweetpadNFTFreezing.freeze(1, 182);

			const freezeBlock = await provider.getBlockNumber();
			const blocksPerDay = await sweetpadNFTFreezing.blocksPerDay();
			const freezeEndBlock = blocksPerDay.mul(182).add(freezeBlock);

			expect(await sweetpadNFT.ownerOf(1)).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadNFTFreezing.nftData(1)).to.eql([caller.address, freezeEndBlock]);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(1)]);
			await expect(tx).to.emit(sweetpadNFTFreezing, "Frozen").withArgs(caller.address, 1, freezeEndBlock, 5);
		});

		it("Should freeze nft in SweetpadNFTFreezing contract (1095 days)", async function () {
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 1);
			const tx = await sweetpadNFTFreezing.freeze(1, 1095);

			const freezeBlock = await provider.getBlockNumber();
			const blocksPerDay = await sweetpadNFTFreezing.blocksPerDay();
			const freezeEndBlock = blocksPerDay.mul(1095).add(freezeBlock);

			expect(await sweetpadNFT.ownerOf(1)).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadNFTFreezing.nftData(1)).to.eql([caller.address, freezeEndBlock]);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(1)]);
			await expect(tx).to.emit(sweetpadNFTFreezing, "Frozen").withArgs(caller.address, 1, freezeEndBlock, 10);
		});
	});

	describe("freezeBatch: ", function () {
		it("Should revert with 'ERC721: transfer caller is not owner nor approved'", async function () {
			await expect(sweetpadNFTFreezing.connect(deployer).freezeBatch([1, 2], [182, 182])).to.revertedWith(
				"ERC721: transfer caller is not owner nor approved"
			);
		});

		it("Should revert with 'SweetpadNFTFreezing: Array lengths is not equal'", async function () {
			await expect(sweetpadNFTFreezing.connect(deployer).freezeBatch([1, 2, 3], [182, 182])).to.revertedWith(
				"SweetpadNFTFreezing: Array lengths is not equal"
			);
		});

		it("Should revert with 'SweetpadNFTFreezing: Freeze period must be greater than 182 days'", async function () {
			await expect(sweetpadNFTFreezing.freezeBatch([1, 2], [181, 182])).to.revertedWith(
				"SweetpadNFTFreezing: Freeze period must be greater than 182 days"
			);
		});

		it("Should freeze nfts in SweetpadNFTFreezing contract", async function () {
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 1);
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 2);
			const tx = await sweetpadNFTFreezing.freezeBatch([1, 2], [182, 1097]);

			const freezeBlock = await provider.getBlockNumber();
			const blocksPerDay = await sweetpadNFTFreezing.blocksPerDay();
			const freezeEndBlock1 = blocksPerDay.mul(182).add(freezeBlock);
			const freezeEndBlock2 = blocksPerDay.mul(1097).add(freezeBlock);

			expect(await sweetpadNFT.ownerOf(1)).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadNFT.ownerOf(2)).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadNFTFreezing.nftData(1)).to.eql([caller.address, freezeEndBlock1]);
			expect(await sweetpadNFTFreezing.nftData(2)).to.eql([caller.address, freezeEndBlock2]);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(1), BigNumber.from(2)]);
			await expect(tx).to.emit(sweetpadNFTFreezing, "Frozen").withArgs(caller.address, 1, freezeEndBlock1, 5);
			await expect(tx).to.emit(sweetpadNFTFreezing, "Frozen").withArgs(caller.address, 2, freezeEndBlock2, 24);
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

	describe("getNftsFrozeByUser: ", function () {
		it("Should return correct nft id's", async function () {
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([]);
			
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 2);
			await sweetpadNFTFreezing.freeze(2, 1095);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(2)]);

			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 1);
			await sweetpadNFTFreezing.freeze(1, 1095);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(2), BigNumber.from(1)]);
		});
	});

	describe("setSweetpadNFT: ", function () {
		it("Should revert with 'Ownable: caller is not the owner'", async function () {
			await expect(sweetpadNFTFreezing.setSweetpadNFT(sweetpadNFT.address)).to.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Should revert with 'SweetpadNFTFreezing: NFT contract address can't be 0'", async function () {
			await expect(sweetpadNFTFreezing.connect(deployer).setSweetpadNFT(constants.AddressZero)).to.revertedWith(
				"SweetpadNFTFreezing: NFT contract address can't be 0"
			);
		});

		it("Should set new nft in SweetpadNFTFreezing contract", async function () {
			await sweetpadNFTFreezing.connect(deployer).setSweetpadNFT(sweetpadNFT.address);

			expect(await sweetpadNFTFreezing.nft()).to.eq(sweetpadNFT.address);
		});
	});

	describe("setSweetpadTicket: ", function () {
		it("Should revert with 'Ownable: caller is not the owner'", async function () {
			await expect(sweetpadNFTFreezing.setSweetpadTicket(sweetpadTicket.address)).to.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Should revert with 'SweetpadNFTFreezing: Ticket contract address can't be 0'", async function () {
			await expect(
				sweetpadNFTFreezing.connect(deployer).setSweetpadTicket(constants.AddressZero)
			).to.revertedWith("SweetpadNFTFreezing: Ticket contract address can't be 0");
		});

		it("Should set new ticket in SweetpadNFTFreezing contract", async function () {
			await sweetpadNFTFreezing.connect(deployer).setSweetpadTicket(sweetpadTicket.address);

			expect(await sweetpadNFTFreezing.ticket()).to.eq(sweetpadTicket.address);
		});
	});
});
