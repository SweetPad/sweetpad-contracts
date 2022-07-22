module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	await deploy("SweetpadReserve", {
		from: deployer.address,
		contract: "SweetpadReserve",
		// TODO set correct admin address
		args: [deployer.address, "0xE8EbCf4Fd1faa9B77c0ec0B26e7Cc32a251Cd799"],
		log: true
	});

	const sweetpadReserve = await getContract("SweetpadReserve");

	return sweetpadReserve;
};

module.exports.tags = ["SweetpadReserve", "stage"];