module.exports = async function ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) {
	const { deployer } = await getNamedSigners();
	
	const sweetpadNFT = await getContract("SweetpadNFT");

	await deploy("SweetpadNFTStaking", {
		from: deployer.address,
		contract: "SweetpadNFTStaking",
		args: [sweetpadNFT.address],
		log: true,
	});
};

module.exports.tags = ["SweetpadNFTStaking", "dev"];
module.exports.dependencies = ["SweetpadNFT"];