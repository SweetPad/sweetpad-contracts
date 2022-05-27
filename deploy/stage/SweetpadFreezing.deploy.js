module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	await deploy("SweetpadFreezing", {
		from: deployer.address,
		contract: "SweetpadFreezing",
		args: [sweetToken.address],
		log: true
	});

	const sweetpadFreezing = await getContract("SweetpadFreezing");

	return sweetpadFreezing;
};
module.exports.tags = ["SweetpadFreezing", "stage"];
module.exports.dependencies = ["SweetpadToken"];
