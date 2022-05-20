module.exports = async function ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) {
	const { deployer } = await getNamedSigners();
	
	const sweetpadNFT = await getContract("SweetpadNFT");

	await deploy("SweetpadNFTFreezing", {
		from: deployer.address,
		contract: "SweetpadNFTFreezing",
		args: [sweetpadNFT.address],
		log: true,
	});
};

module.exports.tags = ["SweetpadNFTFreezing", "prod"];
module.exports.dependencies = ["SweetpadNFT"];