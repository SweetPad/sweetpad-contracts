module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	await deploy("sweetpadLiquidity", {
		from: deployer.address,
		contract: "sweetpadLiquidity",
		args: [deployer.address, sweetToken.address],
		log: true
	});

	const SweetpadLiquidity = await getContract("sweetpadLiquidity");

	return SweetpadLiquidity;
};

module.exports.tags = ["SweetpadLiquidity", "dev"];
module.exports.dependencies = ["SweetpadToken"];