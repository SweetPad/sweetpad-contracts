module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetpadNFT = await getContract("SweetpadNFT");
	await deploy("SweetpadTicket", {
		from: deployer.address,
		contract: "SweetpadTicket",
		args: [sweetpadNFT.address],
		log: true
	});

	const sweetpadTicket = await getContract("SweetpadTicket");

	return sweetpadTicket;
};

module.exports.tags = ["SweetpadTicket", "dev"];
module.exports.dependencies = ["SweetpadNFT"];
