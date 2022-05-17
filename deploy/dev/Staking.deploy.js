module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	await deploy("Staking", {
		from: deployer.address,
		contract: "Staking",
		args: [sweetToken.address],
		log: true
	});

	const staking = await getContract("Staking");

	return staking;
};
module.exports.tags = ["Staking", "dev"];
module.exports.dependencies = ["SweetpadToken"];
