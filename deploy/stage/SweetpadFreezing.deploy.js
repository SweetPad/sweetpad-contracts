module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract, getContractAt } }) => {
	const { deployer } = await getNamedSigners();
	let sweetpadFreezing;

	const sweetToken = await getContract("SweetpadToken");

	try {
		await deploy("SweetpadFreezing", {
			from: deployer.address,
			contract: "SweetpadFreezing",
			args: [sweetToken.address],
			log: true
		});

		sweetpadFreezing = await getContract("SweetpadFreezing");

		// TODO await sweetpadFreezing.transferOwnership(owner.address).then((tx) => tx.wait());
	} catch (error) {
		throw error.message;
	}

	return sweetpadFreezing;
};

module.exports.tags = ["SweetpadFreezing", "stage"];
module.exports.dependencies = ["SweetpadToken"];
