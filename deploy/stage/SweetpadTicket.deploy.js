module.exports = async ({deployments: { deploy }, ethers: { getNamedSigners, getContract }}) => {
	const { deployer } = await getNamedSigners();

	try {
		await deploy("SweetpadTicket", {
			from: deployer.address,
			contract: "SweetpadTicket",
			args: [],
			log: true,
		});
	} catch (error) {
		throw error.message;
	}


	const sweetpadTicket = await getContract("SweetpadTicket");

	return sweetpadTicket;
};
module.exports.tags = ["SweetpadTicket", "stage"];