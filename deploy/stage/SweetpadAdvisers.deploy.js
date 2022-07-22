module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	await deploy("SweetpadAdvisers", {
		from: deployer.address,
		contract: "SweetpadAdvisers",
		args: [deployer.address, sweetToken.address],
		log: true
	});

	const sweetpadAdvisers = await getContract("SweetpadAdvisers");

	return sweetpadAdvisers;
};

module.exports.tags = ["SweetpadAdvisers", "stage"];
module.exports.dependencies = ["SweetpadToken"];
