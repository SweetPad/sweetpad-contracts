const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
		constants: {
			AddressZero
		}
	},
	deployments: { fixture, createFixture }
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetpadTicket = await getContract("SweetpadTicket");

	return [sweetpadTicket];
});

describe("SweetpadTickets", function () {
	let caller, holder, sweetpadTicket;

	before("Before All: ", async function () {
		({ caller, holder } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadTicket] = await setupFixture();
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadTicket.uri(0)).to.equal("");
		});
	});

	describe("Mint", function () {
		it("Should revert if caller is't admin", async function () {
			await expect(sweetpadTicket.connect(caller).mint(holder.address, 1, 10)).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Should mint given amount of tokens to given account", async function () {
			await sweetpadTicket.mint(holder.address, 1, 5);
			await sweetpadTicket.mint(holder.address, 2, 10);
			await sweetpadTicket.mint(caller.address, 3, 20);

			expect(await sweetpadTicket.balanceOf(holder.address, 1)).to.be.equal(5);
			expect(await sweetpadTicket.balanceOf(holder.address, 2)).to.be.equal(10);
			expect(await sweetpadTicket.balanceOf(caller.address, 3)).to.be.equal(20);
			expect(await sweetpadTicket.accountTickets(holder.address)).to.be.equal(15);
			expect(await sweetpadTicket.accountTickets(caller.address)).to.be.equal(20);
			expect(await sweetpadTicket.totalTickets()).to.be.equal(35);
		});
	});

	describe("MintBatch", function () {
		it("Should revert if caller is't admin", async function () {
			await expect(sweetpadTicket.connect(caller).mintBatch(holder.address, [1, 2], [5, 10])).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Should mint batch given amount of tokens to given account", async function () {
			await sweetpadTicket.mintBatch(holder.address, [1, 2], [5, 10]);
			await sweetpadTicket.mintBatch(caller.address, [3], [20]);

			expect(await sweetpadTicket.balanceOf(holder.address, 1)).to.be.equal(5);
			expect(await sweetpadTicket.balanceOf(holder.address, 2)).to.be.equal(10);
			expect(await sweetpadTicket.balanceOf(caller.address, 3)).to.be.equal(20);
			expect(await sweetpadTicket.accountTickets(holder.address)).to.be.equal(15);
			expect(await sweetpadTicket.accountTickets(caller.address)).to.be.equal(20);
			expect(await sweetpadTicket.totalTickets()).to.be.equal(35);
		});
	});

	describe("Burn function: ", function () {
		beforeEach(async function () {
			await sweetpadTicket.mint(holder.address, 1, 5);
			await sweetpadTicket.mint(holder.address, 2, 10);
			await sweetpadTicket.mint(caller.address, 3, 20);
		});

		it("Should revert if caller is't admin", async function () {
			await expect(sweetpadTicket.connect(caller).burn(holder.address, 1)).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Should burn given amount of tokens to given account", async function () {
			await sweetpadTicket.burn(holder.address, 1);
			await sweetpadTicket.burn(holder.address, 2);
			await sweetpadTicket.burn(caller.address, 3);


			expect(await sweetpadTicket.balanceOf(holder.address, 1)).to.be.equal(0);
			expect(await sweetpadTicket.balanceOf(holder.address, 2)).to.be.equal(0);
			expect(await sweetpadTicket.balanceOf(caller.address, 3)).to.be.equal(0);
			expect(await sweetpadTicket.accountTickets(holder.address)).to.be.equal(0);
			expect(await sweetpadTicket.accountTickets(caller.address)).to.be.equal(0);
			expect(await sweetpadTicket.totalTickets()).to.be.equal(0);
		});
	});

	describe("BurnBatch", function () {
		beforeEach(async function () {
			await sweetpadTicket.mintBatch(holder.address, [1, 2], [5, 10]);
			await sweetpadTicket.mintBatch(caller.address, [3], [20]);
		});

		it("Should revert if caller is't admin", async function () {
			await expect(sweetpadTicket.connect(caller).burnBatch(holder.address, [1, 2])).to.be.revertedWith(
				"Ownable: caller is not the owner"
			);
		});

		it("Should mint batch given amount of tokens to given account", async function () {
			sweetpadTicket.burnBatch(holder.address, [1, 2]);
			sweetpadTicket.burnBatch(caller.address, [3]);

			expect(await sweetpadTicket.balanceOf(holder.address, 1)).to.be.equal(0);
			expect(await sweetpadTicket.balanceOf(holder.address, 2)).to.be.equal(0);
			expect(await sweetpadTicket.balanceOf(caller.address, 3)).to.be.equal(0);
			expect(await sweetpadTicket.accountTickets(holder.address)).to.be.equal(0);
			expect(await sweetpadTicket.accountTickets(caller.address)).to.be.equal(0);
			expect(await sweetpadTicket.totalTickets()).to.be.equal(0);
		});
	});

	describe("safeTransferFrom", function () {
		it("Should revert, functions was suspend", async function () {
			await expect(sweetpadTicket.connect(caller).safeTransferFrom(AddressZero, AddressZero, 0, 0, "0x00")).to.be.revertedWith(
				"SweetpadTicket: can't transfer tickets"
			);
		});
	});

	describe("safeBatchTransferFrom", function () {
		it("Should revert, functions was suspend", async function () {
			await expect(sweetpadTicket.connect(caller).safeBatchTransferFrom(AddressZero, AddressZero, [0], [0], "0x00")).to.be.revertedWith(
				"SweetpadTicket: can't batch transfer tickets"
			);
		});
	});
});
