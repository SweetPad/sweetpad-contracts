const { expect } = require("chai");
const {
	ethers: { getContract, getNamedSigners },
	deployments: { fixture }
} = require("hardhat");

describe("StageDeploy", function () {
	let sweetpadFreezing, sweetpadNFT, sweetpadNFTFreezing, sweetpadTicket, sweetpadToken;
	let owner;

	beforeEach(async function () {
		await fixture(["", "stage"]);
		({ owner } = await getNamedSigners());

		sweetpadFreezing = await getContract("SweetpadFreezing");
		sweetpadNFT = await getContract("SweetpadNFT");
		sweetpadNFTFreezing = await getContract("SweetpadNFTFreezing");
		sweetpadTicket = await getContract("SweetpadTicket");
		sweetpadToken = await getContract("SweetpadTicket");
	});

	it("SweetpadFreezing", async function () {
		expect(await sweetpadFreezing.sweetToken()).to.equal(sweetpadToken.address);
		expect(await sweetpadFreezing.getBlocksPerDay()).to.equal(10);
		expect(await sweetpadFreezing.getMinFreezePeriod()).to.equal(
			(await sweetpadFreezing.getBlocksPerDay()).mul(182)
		);
		expect(await sweetpadFreezing.getMaxFreezePeriod()).to.equal(
			(await sweetpadFreezing.getBlocksPerDay()).mul(1095)
		);
		// TODO check owner
	});

	it("SweetpadNFT", async function () {
		expect(await sweetpadNFT.name()).to.equal("Sweet Dragon");
		expect(await sweetpadNFT.symbol()).to.equal("SWTD");
		expect(await sweetpadNFT.tokenURI(0)).to.equal("ipfs://");
		expect(await sweetpadNFT.tierToBoost(0)).to.equal(5);
		expect(await sweetpadNFT.tierToBoost(1)).to.equal(12);
		expect(await sweetpadNFT.tierToBoost(2)).to.equal(30);
		expect(await sweetpadNFT.owner()).to.equal(owner.address);
	});

	it("SweetpadNFTFreezing", async function () {
		expect(await sweetpadNFTFreezing.nft()).to.equal(sweetpadNFT.address);
		expect(await sweetpadNFTFreezing.ticket()).to.equal(sweetpadTicket.address);
		expect(await sweetpadNFTFreezing.blocksPerDay()).to.equal(10);
		expect(await sweetpadNFTFreezing.minFreezePeriod()).to.equal(
			(await sweetpadNFTFreezing.blocksPerDay()).mul(182)
		);
		expect(await sweetpadNFTFreezing.maxFreezePeriod()).to.equal(
			(await sweetpadNFTFreezing.blocksPerDay()).mul(1095)
		);
		expect(await sweetpadNFT.owner()).to.equal(owner.address);
	});

	it("SweetpadTicket", async function () {
		expect(await sweetpadTicket.uri(0)).to.equal("");
		expect(await sweetpadTicket.owner()).to.equal(sweetpadNFTFreezing.address);
	});
});
