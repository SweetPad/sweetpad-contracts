const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
		constants: { AddressZero }
	},
	deployments: { fixture, createFixture }
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetpadTicket = await getContract("SweetpadTicket");
	const sweetpadNFT = await getContract("SweetpadNFT");
	const sweetpadIDO = await getContract("SweetpadIDO");
	const sweetpadNFTFreezing = await getContract("SweetpadNFTFreezing");
	await sweetpadTicket.setNFTFreezing(sweetpadNFTFreezing.address);

	return [sweetpadTicket, sweetpadNFT, sweetpadIDO];
});

describe("SweetpadTickets", function () {
	let caller, holder, sweetpadTicket, sweetpadNFT, sweetpadIDO;

	before("Before All: ", async function () {
		({ caller, holder } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadTicket, sweetpadNFT, sweetpadIDO] = await setupFixture();
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadTicket.sweetpadNFT()).to.equal(sweetpadNFT.address);
		});
	});

	describe("Mint", function () {
		it("Should revert if caller is't admin", async function () {
			await expect(
				sweetpadTicket.connect(caller).mint(holder.address, 10, sweetpadIDO.address)
			).to.be.revertedWith("Ownable: caller is not the owner");
		});

		it("Should mint given amount of tokens to given account", async function () {
			await sweetpadTicket.mint(holder.address, 1, sweetpadIDO.address);
			await sweetpadTicket.mint(holder.address, 2, sweetpadIDO.address);
			await sweetpadTicket.mint(caller.address, 3, sweetpadIDO.address);

			expect(await sweetpadTicket.balanceOf(holder.address)).to.be.equal(3);
			expect(await sweetpadTicket.balanceOf(caller.address)).to.be.equal(3);
		});
	});

	describe("TransferFrom", function () {
		it("Should revert, functions was suspend", async function () {
			await expect(
				sweetpadTicket.connect(caller).transferFrom(AddressZero, AddressZero, 0)
			).to.be.revertedWith("SweetpadTicket: can't transfer tickets");
		});
	});
});
