module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	await deploy("SweetpadCharity", {
		from: deployer.address,
		contract: "SweetpadCharity",
		args: [deployer.address, sweetToken.address],
		log: true
	});

	const sweetpadCharity = await getContract("SweetpadCharity");

	return sweetpadCharity;
};

module.exports.tags = ["sweetpadCharity", "stage"];
module.exports.dependencies = ["SweetpadToken"];
