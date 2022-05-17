const { expect } = require("chai");
const {
	ethers: { getContract, getNamedSigners },
	deployments: { fixture }
} = require("hardhat");

describe("SweetpadNFT", function () {
	let sweetpadNFT;
	let deployer, owner, caller, holder;

	beforeEach(async function () {
		await fixture(["", "dev"]);
		({ deployer, owner, caller, holder } = await getNamedSigners());
		sweetpadNFT = await getContract("SweetpadNFT");
	});

	it("Should initialize correct", async function () {
		expect(await sweetpadNFT.name()).to.equal("SweetpadNFT");
		expect(await sweetpadNFT.owner()).to.equal(deployer.address);
		expect(await sweetpadNFT.symbol()).to.equal("SWTNFT");
		expect(await sweetpadNFT.tokenURI(0)).to.equal("ipfs://");
		expect(await sweetpadNFT.tierToBoost(0)).to.equal(5);
		expect(await sweetpadNFT.tierToBoost(1)).to.equal(12);
		expect(await sweetpadNFT.tierToBoost(2)).to.equal(30);
	});

	describe("setBaseURI function", function () {
		it("Should revert if caller is't admin", async function() {
			await expect(sweetpadNFT.connect(caller).setBaseURI("ipfs://")).to.be.revertedWith("Ownable: caller is not the owner");
		});

		it("Should update baseURI", async function() {
			await sweetpadNFT.setBaseURI("ipns://");
			expect(await sweetpadNFT.tokenURI(0)).to.be.equal("ipns://");
		});
	});

	describe("currentID", function() {
		it("Should return last minted token ID", async function() {
			expect(await sweetpadNFT.currentID()).to.equal(0);
			await sweetpadNFT.safeMint(holder.address, 0);
			expect(await sweetpadNFT.currentID()).to.equal(1);
		});
	});

	describe("safeTransfer", function () {
		it("Should Transfer correctly", async function () {
			await sweetpadNFT.safeMint(holder.address, 0);
			await sweetpadNFT.connect(holder).safeTransfer(owner.address, 1, "0x00");
			expect(await sweetpadNFT.ownerOf(1)).to.equal(owner.address);
		});
	});

	describe("safeBatchTransfer", function () {
		it("Should safeBatchTransfer correctly", async function () {
			await sweetpadNFT.safeMint(holder.address, 0);
			await sweetpadNFT.safeMint(holder.address, 1);

			await sweetpadNFT.connect(holder).safeBatchTransfer(owner.address, [1, 2], "0x00");

			expect(await sweetpadNFT.ownerOf(1)).to.equal(owner.address);
			expect(await sweetpadNFT.ownerOf(2)).to.equal(owner.address);
		});
	});

	describe("Mint function", function () {
		it("Should revert if caller is't admin", async function () {
			await expect(sweetpadNFT.connect(caller).safeMint(holder.address, 1)).to.be.revertedWith("Ownable: caller is not the owner");
		});


		it("Should emit event Create", async function () {
			await expect(sweetpadNFT.safeMint(holder.address, 1)).to.emit(sweetpadNFT, "Create").withArgs(1, 1, holder.address);
		});

		it("Should safeMint", async function () {
			await sweetpadNFT.safeMint(holder.address, 0);
			await sweetpadNFT.safeMint(holder.address, 1);
			await sweetpadNFT.safeMint(owner.address, 2);
			await sweetpadNFT.safeMint(owner.address, 1);

			expect(await sweetpadNFT.ownerOf(1)).to.equal(holder.address);
			expect(await sweetpadNFT.ownerOf(2)).to.equal(holder.address);
			expect(await sweetpadNFT.ownerOf(3)).to.equal(owner.address);
			expect(await sweetpadNFT.idToTier(1)).to.equal(0);
			expect(await sweetpadNFT.idToTier(2)).to.equal(1);
			expect(await sweetpadNFT.idToTier(4)).to.equal(1);
		});
	});

	describe("MintBatch function", function () {
		it("Should revert if caller is't admin", async function () {
			await expect(sweetpadNFT.connect(caller).safeMintBatch(holder.address, [1, 1])).to.be.revertedWith("Ownable: caller is not the owner");
		});

		it("Should emit event Create", async function () {
			const tiers = [1, 1, 0, 2];
			const tx = await sweetpadNFT.safeMintBatch(holder.address, tiers);
			tiers.forEach(tier => {
				expect(tx)
					.to.emit(sweetpadNFT, "Create")
					.withArgs(1, tier, holder.address);
			});
		});

		it("Should MintBatch", async function () {
			const tiers = [1, 1, 0, 2];
			await sweetpadNFT.safeMintBatch(holder.address, [1, 1, 0, 2]);

			for await (const i of tiers.keys()) {
				expect(await sweetpadNFT.ownerOf(i+1)).to.equal(holder.address);
				expect(await sweetpadNFT.idToTier(i+1)).to.equal(tiers[i]);
			}
		});
	});

	describe("supportsInterface", function () {
		it("Should return true", async function () {
			const supportsIERC721Interface = 0x80ac58cd;

			expect(await sweetpadNFT.supportsInterface(supportsIERC721Interface)).to.eq(true);
		});

		it("Should return false", async function () {
			const supportsIERC721Interface = 0xd9b67a27;

			expect(await sweetpadNFT.supportsInterface(supportsIERC721Interface)).to.eq(false);
		});
	});

	describe("TokenURI function", function () {
		it("Should return baseURI if token doesn`t exist", async function () {
			expect(await sweetpadNFT.tokenURI(0)).to.be.equal("ipfs://");
			expect(await sweetpadNFT.tokenURI(1)).to.be.equal("ipfs://");
		});

		it("Should correct TokenURI if token id exists", async function () {
			const tiers = [2, 0, 1, 1, 2];
			await sweetpadNFT.safeMintBatch(holder.address, tiers);

			for (let i = 0; i < tiers.length; i++) {
				expect(await sweetpadNFT.tokenURI(i + 1)).to.be.equal("ipfs://" + (i + 1) + ".json");	
			}
		});
	});
});
