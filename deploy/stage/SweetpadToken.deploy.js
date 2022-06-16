module.exports = async ({deployments: { deploy }, ethers: { getNamedSigners, getContract }}) => {
	const { deployer } = await getNamedSigners();

	try {
		await deploy("SweetpadToken", {
			from: deployer.address,
			contract: "SweetpadToken",
			args: [],
			log: true,
		});
	} catch (error) {
		throw error.message;
	}

	const sweetpadToken = await getContract("SweetpadToken");

	return sweetpadToken;
};

module.exports.tags = ["SweetpadToken", "stage"];
