const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther }
	},
	deployments: { fixture, createFixture }
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetpadToken = await getContract("SweetpadToken");

	return [sweetpadToken];
});

describe("SweetpadToken", function () {
	let deployer, caller, sweetpadToken;

	before("Before All: ", async function () {
		({ deployer, caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadToken] = await setupFixture();
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadToken.totalSupply()).to.equal(parseEther("1000000"));
			expect(await sweetpadToken.name()).to.equal("Sweetpad Token");
			expect(await sweetpadToken.symbol()).to.equal("SWT");
			expect(await sweetpadToken.decimals()).to.equal(18);
		});
	});

	describe("Mint function: ", function () {
		it("Should mint given amount of tokens to given account", async function () {
			await expect(() =>
				sweetpadToken.connect(deployer).mint(caller.address, parseEther("1000"))
			).to.changeTokenBalance(sweetpadToken, caller, parseEther("1000"));
		});
	});

	describe("Burn function: ", function () {
		it("Should burn given amount of tokens from given account", async function () {
			await sweetpadToken.connect(deployer).mint(caller.address, parseEther("0.001"));

			await expect(() =>
				sweetpadToken
					.connect(caller)
					.burn(caller.address, parseEther("0.001"))
					.to.changeTokenBalance(sweetpadToken, caller, -1000000000000000)
			);
		});
	});
});
