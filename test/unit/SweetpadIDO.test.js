const { expect } = require("chai");
const {
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther }
		// BigNumber,
		// constants
	},
	deployments: { fixture, createFixture },
	// timeAndMine,
	ethers
} = require("hardhat");

const setupFixture = createFixture(async () => {
	await fixture(["", "dev"]);

	const sweetToken = await getContract("SweetpadToken");
	const sweetpadIDO = await getContract("SweetpadIDO");
	const lottery = await getContract("SweetpadLottery");
	const sweetpadNFTFreezing = await getContract("SweetpadNFTFreezing");
	const sweetpadTicket = await getContract("SweetpadTicket");
	const sweetpadFreezing = await getContract("SweetpadFreezing");
	const asset = await getContract("AssetMock");

	return [sweetpadFreezing, sweetToken, sweetpadIDO, lottery, sweetpadNFTFreezing, sweetpadTicket, asset];
});

describe("SweetpadIDO", function () {
	let deployer,
		caller,
		// owner,
		sweetpadFreezing,
		sweetToken,
		sweetpadIDO,
		lottery,
		sweetpadNFTFreezing,
		sweetpadTicket,
		asset;

	const daysToBlocks = async (days) => {
		return (await sweetpadFreezing.getBlocksPerDay()).mul(days);
	};

	before("Before All: ", async function () {
		({ deployer, /* owner, */ caller } = await getNamedSigners());
	});

	beforeEach(async function () {
		[sweetpadFreezing, sweetToken, sweetpadIDO, lottery, sweetpadNFTFreezing, sweetpadTicket, asset] =
			await setupFixture();
		await sweetToken.connect(deployer).transfer(caller.address, parseEther("100000"));
		const blockNumber = await ethers.provider.getBlockNumber();
		await sweetpadIDO.setup(
			1500,
			8500,
			50000,
			2000,
			parseEther("100000"),
			parseEther("0.05"),
			blockNumber + 10,
			blockNumber + 100,
			blockNumber + 101,
			blockNumber + 200
		);
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values", async function () {
			expect(await sweetpadIDO.sweetpadTicket()).to.equal(sweetpadTicket.address);
			expect(await sweetpadIDO.sweetpadLottery()).to.equal(lottery.address);
			expect(await sweetpadIDO.sweetpadNFTFreezing()).to.equal(sweetpadNFTFreezing.address);
			expect(await sweetpadIDO.sweetpadFreezing()).to.equal(sweetpadFreezing.address);
			expect(await sweetpadIDO.asset()).to.equal(asset.address);
			// TODO suspend for slither
			// const clientRole = await sweetpadIDO.CLIENT_ROLE();
			// const adminRole = await sweetpadIDO.DEFAULT_ADMIN_ROLE();

			// expect(await sweetpadIDO.hasRole(clientRole, owner.address)).to.be.true;
			// expect(await sweetpadIDO.hasRole(adminRole, deployer.address)).to.be.true;
		});
		it("Setup function", async function () {
			const blockNumber = await ethers.provider.getBlockNumber();
			await sweetpadIDO.setup(
				1500,
				8500,
				50000,
				2000,
				parseEther("10000"),
				parseEther("0.05"),
				blockNumber + 10,
				blockNumber + 100,
				blockNumber + 101,
				blockNumber + 200
			);

			expect(await sweetpadIDO.percentForLottery()).to.equal(1500);
			expect(await sweetpadIDO.percentForGuaranteedAllocation()).to.equal(8500);
			expect(await sweetpadIDO.totalPower()).to.equal(50000);
			expect(await sweetpadIDO.commission()).to.equal(2000);
			expect(await sweetpadIDO.tokensToSell()).to.equal(parseEther("10000"));
			expect(await sweetpadIDO.tokenPrice()).to.equal(parseEther("0.05"));

			expect(await sweetpadIDO.idoSaleStart()).to.equal(blockNumber + 10);
			expect(await sweetpadIDO.idoSaleEnd()).to.equal(blockNumber + 100);
			expect(await sweetpadIDO.idoSecondSaleStart()).to.equal(blockNumber + 101);
			expect(await sweetpadIDO.idoSecondSaleEnd()).to.equal(blockNumber + 200);
		});

		it("Should revert if percents are incorrect", async function () {
			const blockNumber = await ethers.provider.getBlockNumber();
			await expect(
				sweetpadIDO.setup(
					90,
					8500,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: Trying to set incorrect percent for lottery allocation");

			await expect(
				sweetpadIDO.setup(
					101,
					1400,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: Trying to set incorrect percent for guaranted allocation");

			await expect(
				sweetpadIDO.setup(
					1600,
					8500,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: Trying to set incorrect percent for lottery allocation");

			await expect(
				sweetpadIDO.setup(
					1500,
					9950,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: Trying to set incorrect percent for guaranted allocation");

			await expect(
				sweetpadIDO.setup(
					1000,
					9900,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: Incorrect percents");
		});

		it("Should revert if totalPower is zero", async function () {
			const blockNumber = await ethers.provider.getBlockNumber();
			await expect(
				sweetpadIDO.setup(
					1000,
					9000,
					0,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: TotalPower can't be zero");
		});

		it("Should revert if tokensToSell_ is zero", async function () {
			const blockNumber = await ethers.provider.getBlockNumber();
			await expect(
				sweetpadIDO.setup(
					1000,
					9000,
					50000,
					2000,
					0,
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: TokensToSell can't be zero");
		});

		it("Should revert if tokenPrice_ is zero", async function () {
			const blockNumber = await ethers.provider.getBlockNumber();
			await expect(
				sweetpadIDO.setup(
					1000,
					9000,
					50000,
					2000,
					parseEther("10000"),
					0,
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: TokenPrice can't be zero");
		});

		it("Should revert if start and end blockNumbers are incorrect", async function () {
			const blockNumber = await ethers.provider.getBlockNumber();
			// Start block number is less than current
			await expect(
				sweetpadIDO.setup(
					1000,
					9000,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber - 1,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: Invalid block number");

			// Start block number is greater than start
			await expect(
				sweetpadIDO.setup(
					1000,
					9000,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 100,
					blockNumber + 50,
					blockNumber + 101,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: IDO sale end block must be greater then start block");

			// Second start block number is less than first end
			await expect(
				sweetpadIDO.setup(
					1000,
					9000,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 80,
					blockNumber + 200
				)
			).to.be.revertedWith("SweetpadIDO: IDO second sale start block must be greater then first end block");

			// Second start block number is less than first end
			await expect(
				sweetpadIDO.setup(
					1000,
					9000,
					50000,
					2000,
					parseEther("10000"),
					parseEther("0.05"),
					blockNumber + 10,
					blockNumber + 100,
					blockNumber + 101,
					blockNumber + 80
				)
			).to.be.revertedWith("SweetpadIDO: IDO second sale end block must be greater then start block");
		});
	});

	describe("Buy from first stage", function () {
		it.only("Two users try to buy from first stage", async function () {
			await asset.transfer(sweetpadIDO.address, parseEther("50000"));
			await sweetToken.connect(deployer).approve(sweetpadFreezing.address, parseEther("40000"));
			await sweetToken.connect(caller).approve(sweetpadFreezing.address, parseEther("10000"));
			await sweetpadFreezing.connect(deployer).freezeSWT(parseEther("40000"), await daysToBlocks(10));
			await sweetpadFreezing.connect(caller).freezeSWT(parseEther("10000"), await daysToBlocks(10));
			console.log((await sweetpadFreezing.totalPower(deployer.address)).toString());
			console.log((await sweetpadFreezing.totalPower(caller.address)).toString());
		});
	});
});
