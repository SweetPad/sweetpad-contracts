module.exports = async function ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) {
	const { deployer } = await getNamedSigners();
	
	const sweetpadNFT = await getContract("SweetpadNFT");
	const sweetpadTicket = await getContract("SweetpadTicket");

	await deploy("SweetpadNFTFreezing", {
		from: deployer.address,
		contract: "SweetpadNFTFreezing",
		args: [sweetpadNFT.address, sweetpadTicket.address],
		log: true,
	});
};

module.exports.tags = ["SweetpadNFTFreezing", "stage"];
module.exports.dependencies = ["SweetpadNFT", "SweetpadTicket"];