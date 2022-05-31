module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract, getContractAt } }) => {
	const { deployer } = await getNamedSigners();
	let sweetpadFreezing;

	const sweetToken = await getContractAt("SweetpadToken", "0xE8EbCf4Fd1faa9B77c0ec0B26e7Cc32a251Cd799");

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

module.exports.tags = ["SweetpadFreezing", "prod"];
