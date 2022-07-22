module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	await deploy("SweetpadMarketing", {
		from: deployer.address,
		contract: "SweetpadMarketing",
		args: [deployer.address, sweetToken.address],
		log: true
	});

	const sweetpadMarketing = await getContract("SweetpadMarketing");

	return sweetpadMarketing;
};

module.exports.tags = ["SweetpadMarketing", "dev"];
module.exports.dependencies = ["SweetpadToken"];
