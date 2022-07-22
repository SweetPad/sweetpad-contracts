module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	await deploy("SweetpadTeamTokenomics", {
		from: deployer.address,
		contract: "SweetpadTeamTokenomics",
		args: [deployer.address, sweetToken.address],
		log: true
	});

	const sweetpadTeamTokenomics = await getContract("SweetpadTeamTokenomics");

	return sweetpadTeamTokenomics;
};

module.exports.tags = ["SweetpadTeamTokenomics", "stage"];
module.exports.dependencies = ["SweetpadToken"];
