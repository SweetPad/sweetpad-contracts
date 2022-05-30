module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	const lpToken = await getContract("lpToken");
	await deploy("SweetpadFreezing", {
		from: deployer.address,
		contract: "SweetpadFreezing",
		args: [sweetToken.address, lpToken.address],
		log: true
	});

	const sweetpadFreezing = await getContract("SweetpadFreezing");

	return sweetpadFreezing;
};
module.exports.tags = ["SweetpadFreezing", "dev"];
module.exports.dependencies = ["SweetpadToken"];
