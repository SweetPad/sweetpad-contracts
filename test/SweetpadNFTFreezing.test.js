const { expect } = require("chai");
const {
	ethers: { getContract, getNamedSigners, constants, provider, BigNumber },
	deployments: { fixture, createFixture }
} = require("hardhat");

describe("SweetpadNFTFreezing", function () {
	let deployer, caller;
	let sweetpadNFT, sweetpadTicket, sweetpadNFTFreezing;
	
	const blocksPerDay = BigNumber.from(28674);
	const blocksPer182Days = blocksPerDay.mul(182);
	const blocksPer1095Days = blocksPerDay.mul(1095);

	const setupFixture = createFixture(async () => {
		await fixture(["", "dev"]);

		const sweetpadNFT = await getContract("SweetpadNFT");
		const sweetpadTicket = await getContract("SweetpadTicket");
		const sweetpadNFTFreezing = await getContract("SweetpadNFTFreezing", caller);

		await sweetpadTicket.transferOwnership(sweetpadNFTFreezing.address);
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
			expect(await sweetpadNFTFreezing.blocksPerDay()).to.equal(blocksPerDay);
			expect(await sweetpadNFTFreezing.minFreezePeriod()).to.equal(blocksPer182Days);
			expect(await sweetpadNFTFreezing.maxFreezePeriod()).to.equal(blocksPer1095Days);
		});
	});

	describe("freeze: ", function () {
		it("Should revert with 'ERC721: transfer caller is not owner nor approved'", async function () {
			await expect(sweetpadNFTFreezing.connect(deployer).freeze(1, blocksPer182Days)).to.revertedWith(
				"ERC721: transfer caller is not owner nor approved"
			);
		});

		it("Should revert with 'SweetpadNFTFreezing: Wrong freeze period'", async function () {
			await expect(sweetpadNFTFreezing.freeze(1, blocksPer182Days.sub(blocksPerDay))).to.revertedWith(
				"SweetpadNFTFreezing: Wrong freeze period"
			);

			await expect(sweetpadNFTFreezing.freeze(1, blocksPer1095Days.add(blocksPerDay))).to.revertedWith(
				"SweetpadNFTFreezing: Wrong freeze period"
			);
		});

		it("Should freeze nft in SweetpadNFTFreezing contract (182 days)", async function () {
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 1);
			const tx = await sweetpadNFTFreezing.freeze(1, blocksPer182Days);

			const freezeBlock = BigNumber.from(await provider.getBlockNumber());
			const freezeEndBlock = blocksPer182Days.add(freezeBlock);

			expect(await sweetpadNFT.ownerOf(1)).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadNFTFreezing.nftData(1)).to.eql([caller.address, freezeBlock, freezeEndBlock]);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(1)]);
			await expect(tx).to.emit(sweetpadNFTFreezing, "Froze").withArgs(caller.address, 1, freezeEndBlock, 5);
		});

		it("Should freeze nft in SweetpadNFTFreezing contract (1095 days)", async function () {
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 1);
			const tx = await sweetpadNFTFreezing.freeze(1, blocksPer1095Days);

			const freezeBlock = BigNumber.from(await provider.getBlockNumber());
			const freezeEndBlock = blocksPer1095Days.add(freezeBlock);

			expect(await sweetpadNFT.ownerOf(1)).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadNFTFreezing.nftData(1)).to.eql([caller.address, freezeBlock, freezeEndBlock]);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(1)]);
			await expect(tx).to.emit(sweetpadNFTFreezing, "Froze").withArgs(caller.address, 1, freezeEndBlock, 10);
		});
	});

	describe("freezeBatch: ", function () {
		it("Should revert with 'SweetpadNFTFreezing: Array lengths is not equal'", async function () {
			await expect(sweetpadNFTFreezing.connect(deployer).freezeBatch([1, 2, 3], [blocksPer182Days, blocksPer182Days])).to.revertedWith(
				"SweetpadNFTFreezing: Array lengths is not equal"
			);
		});

		it("Should freeze nfts in SweetpadNFTFreezing contract", async function () {
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 1);
			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 2);
			const tx = await sweetpadNFTFreezing.freezeBatch([1, 2], [blocksPer182Days, blocksPer1095Days]);

			const freezeBlock = BigNumber.from(await provider.getBlockNumber());
			const freezeEndBlock1 = blocksPer182Days.add(freezeBlock);
			const freezeEndBlock2 = blocksPer1095Days.add(freezeBlock);

			expect(await sweetpadNFT.ownerOf(1)).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadNFT.ownerOf(2)).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadNFTFreezing.nftData(1)).to.eql([caller.address, freezeBlock, freezeEndBlock1]);
			expect(await sweetpadNFTFreezing.nftData(2)).to.eql([caller.address, freezeBlock, freezeEndBlock2]);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(1), BigNumber.from(2)]);
			await expect(tx).to.emit(sweetpadNFTFreezing, "Froze").withArgs(caller.address, 1, freezeEndBlock1, 5);
			await expect(tx).to.emit(sweetpadNFTFreezing, "Froze").withArgs(caller.address, 2, freezeEndBlock2, 24);
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
			await sweetpadNFTFreezing.freeze(2, blocksPer1095Days);
			expect(await sweetpadNFTFreezing.getNftsFrozeByUser(caller.address)).to.eql([BigNumber.from(2)]);

			await sweetpadNFT.connect(caller).approve(sweetpadNFTFreezing.address, 1);
			await sweetpadNFTFreezing.freeze(1, blocksPer1095Days);
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
