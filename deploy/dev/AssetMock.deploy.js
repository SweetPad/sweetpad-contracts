module.exports = async ({deployments: { deploy }, ethers: { getNamedSigners, getContract }}) => {
	const { deployer } = await getNamedSigners();

	await deploy("AssetMock", {
		from: deployer.address,
		contract: "AssetMock",
		args: [],
		log: true,
	});

	const assetMock = await getContract("AssetMock");
	return assetMock;
};

module.exports.tags = ["AssetMock", "dev"];
