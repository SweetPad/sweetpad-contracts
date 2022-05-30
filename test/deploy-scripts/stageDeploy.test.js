const { expect } = require("chai");
const {
	ethers: { getContract, getNamedSigners },
	deployments: { fixture }
} = require("hardhat");

describe("StageDeploy", function () {
	let sweetpadNFT;
	let deployer;

	beforeEach(async function () {
		await fixture(["", "stage"]);
		({ deployer } = await getNamedSigners());
		sweetpadNFT = await getContract("SweetpadNFT");
	});

	it("Should initialize correct", async function () {
		expect(await sweetpadNFT.name()).to.equal("Sweet Dragon");
		expect(await sweetpadNFT.owner()).to.equal(deployer.address);
		expect(await sweetpadNFT.symbol()).to.equal("SWTD");
		expect(await sweetpadNFT.tokenURI(0)).to.equal("ipfs://");
		expect(await sweetpadNFT.tierToBoost(0)).to.equal(5);
		expect(await sweetpadNFT.tierToBoost(1)).to.equal(12);
		expect(await sweetpadNFT.tierToBoost(2)).to.equal(30);
	});
});
