module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract, utils } }) => {
	const { deployer, owner } = await getNamedSigners();
	const lottery = await getContract("SweetpadLottery");
	const sweetpadNFTFreezing = await getContract("SweetpadNFTFreezing");
	const sweetpadTicket = await getContract("SweetpadTicket");
	const sweetpadFreezing = await getContract("SweetpadFreezing");
	const asset = await getContract("AssetMock");
	await deploy("SweetpadIDO", {
		from: deployer.address,
		contract: "SweetpadIDO",
		args: [
			sweetpadTicket.address,
			sweetpadFreezing.address,
			sweetpadNFTFreezing.address,
			lottery.address,
			asset.address,
			owner.address,
			deployer.address
		],
		log: true
	});

	const sweetpadIDO = await getContract("SweetpadIDO");

	return sweetpadIDO;
};

module.exports.tags = ["SweetpadIDO", "dev"];
module.exports.dependencies = ["SweetpadNFTFreezing", "SweetpadLottery", "SweetpadFreezing", "AssetMock"];
