module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();

	await deploy("SweetpadTicket", {
		from: deployer.address,
		contract: "SweetpadTicket",
		args: [],
		log: true
	});

	const sweetpadTicket = await getContract("SweetpadTicket");

	return sweetpadTicket;
};

module.exports.tags = ["SweetpadTicket", "dev"];
