module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	await deploy("SweetpadLiquidity", {
		from: deployer.address,
		contract: "SweetpadLiquidity",
		// TODO set correct admin address
		args: [deployer.address, "0xE8EbCf4Fd1faa9B77c0ec0B26e7Cc32a251Cd799"],
		log: true
	});

	const sweetpadLiquidity = await getContract("SweetpadLiquidity");

	return sweetpadLiquidity;
};

module.exports.tags = ["SweetpadLiquidity", "stage"];