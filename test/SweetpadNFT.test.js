const { expect } = require("chai");
const {
	ethers: { getContract },
	deployments: { fixture },
	ethers,
} = require("hardhat");

describe("SweetpadNFT", function () {
	let sweetpadNFT;
	let deployer, owner, holder;

	const mintSweetpadNFT = (account, tier, minter = deployer) => {
		return sweetpadNFT.connect(minter).mint(account.address, tier);
	};

	const mintBatchSweetpadNFT = (account, tiers, minter = deployer) => {
		return sweetpadNFT.connect(minter).mintBatch(account.address, tiers);
	};

	beforeEach(async function () {
		await fixture();
		[deployer, owner /* caller */, , holder] = await ethers.getSigners();
		sweetpadNFT = await getContract("SweetpadNFT");
	});
	it("Should initialize correct", async function () {
		expect(await sweetpadNFT.name()).to.equal("SweetpadNFT");
		expect(await sweetpadNFT.owner()).to.equal(deployer.address);
		expect(await sweetpadNFT.symbol()).to.equal("SWTNFT");
	});

	describe("Mint function", function () {
		it("Should mint", async function () {
			await mintSweetpadNFT(owner, 1);
			await mintSweetpadNFT(owner, 1);
			expect(await sweetpadNFT.ownerOf(1)).to.equal(owner.address);
			expect(await sweetpadNFT.ownerOf(2)).to.equal(owner.address);
		});

		it("Should emit event TokenTier", async function () {
			await expect(mintSweetpadNFT(owner, 1)).to.emit(sweetpadNFT, "NFTMinted").withArgs(1, 1, owner.address);
		});

		it("Can mint only admin", async function () {
			await expect(mintSweetpadNFT(owner, 1, holder)).to.be.revertedWith("Ownable: caller is not the owner");
		});

		it("Should revert if tier doesn`t exist", async function () {
			await expect(mintSweetpadNFT(owner, 4)).to.be.revertedWith("SweetpadNFT: Tier doesn't exist");
		});
	});

	describe("MintBatch function", function () {
		it("Should MintBatch", async function () {
			await mintBatchSweetpadNFT(owner, [1, 1, 2, 2, 3, 3]);
			expect(await sweetpadNFT.ownerOf(1)).to.equal(owner.address);
			expect(await sweetpadNFT.ownerOf(2)).to.equal(owner.address);
			expect(await sweetpadNFT.ownerOf(3)).to.equal(owner.address);
			expect(await sweetpadNFT.ownerOf(4)).to.equal(owner.address);
			expect(await sweetpadNFT.ownerOf(5)).to.equal(owner.address);
			expect(await sweetpadNFT.ownerOf(6)).to.equal(owner.address);
		});

		it("Should emit event TokenTier", async function () {
			await expect(mintBatchSweetpadNFT(owner, [1]))
				.to.emit(sweetpadNFT, "NFTMinted")
				.withArgs(1, 1, owner.address);
		});

		it("Can mint only admin", async function () {
			await expect(mintBatchSweetpadNFT(owner, [1], holder)).to.be.revertedWith("Ownable: caller is not the owner");
		});

		it("Should revert if tier doesn`t exist", async function () {
			await expect(mintBatchSweetpadNFT(owner, [4])).to.be.revertedWith("SweetpadNFT: Tier doesn't exist");
		});
	});

	describe("safeTransfer function", function () {
		it("Should Transfer correctly", async function () {
			await mintSweetpadNFT(owner, 1);
			expect(await sweetpadNFT.ownerOf(1)).to.equal(owner.address);
			await sweetpadNFT.connect(owner).safeTransfer(holder.address, 1, "0x00");
			expect(await sweetpadNFT.ownerOf(1)).to.equal(holder.address);
		});
	});

	describe("safeBatchTransfer function", function () {
		it("Should safeBatchTransfer correctly", async function () {
			await mintSweetpadNFT(owner, 1);
			await mintSweetpadNFT(owner, 2);
			expect(await sweetpadNFT.ownerOf(1)).to.equal(owner.address);
			expect(await sweetpadNFT.ownerOf(2)).to.equal(owner.address);

			await sweetpadNFT.connect(owner).safeBatchTransfer(holder.address, [1, 2], "0x00");

			expect(await sweetpadNFT.ownerOf(1)).to.equal(holder.address);
			expect(await sweetpadNFT.ownerOf(1)).to.equal(holder.address);
		});
	});

	describe("support interface function", function () {
		it("Should return true", async function () {
			const supportsIERC721Interface = 0x80ac58cd;

			expect(await sweetpadNFT.supportsInterface(supportsIERC721Interface)).to.eq(true);
		});
		it("Should return false", async function () {
			const supportsIERC721Interface = 0xd9b67a27;

			expect(await sweetpadNFT.supportsInterface(supportsIERC721Interface)).to.eq(false);
		});
	});

	describe("Approve, transferFrom functions", function () {
		it("Should call approveForAll and transfer from", async function () {
			await mintBatchSweetpadNFT(owner, [1, 1, 2, 2, 3, 3]);
			await sweetpadNFT.connect(owner).setApprovalForAll(holder.address, true);
			expect(await sweetpadNFT.isApprovedForAll(owner.address, holder.address)).to.equal(true);

			await sweetpadNFT.connect(holder).transferFrom(owner.address, deployer.address, 1);
			expect(await sweetpadNFT.ownerOf(1)).to.equal(deployer.address);
		});

		it("Should call approve and transfer from", async function () {
			await mintBatchSweetpadNFT(owner, [1]);
			await sweetpadNFT.connect(owner).approve(holder.address, 1);
			expect(await sweetpadNFT.getApproved(1)).to.equal(holder.address);

			await sweetpadNFT.connect(holder).transferFrom(owner.address, deployer.address, 1);
			expect(await sweetpadNFT.ownerOf(1)).to.equal(deployer.address);
		});
	});

	describe("TokenURI function", function () {
		it("Should return baseURI if token doesn`t exist, and correct TokenURI if token id exists", async function () {
			expect(await sweetpadNFT.tokenURI(1)).to.be.equal("ipfs://");
			await mintSweetpadNFT(owner, 1);
			expect(await sweetpadNFT.tokenURI(1)).to.be.equal("ipfs:///1.json");
		});
	});
});
