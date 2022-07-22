module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	const sweetToken = await getContract("SweetpadToken");
	await deploy("SweetpadReserve", {
		from: deployer.address,
		contract: "SweetpadReserve",
		args: [deployer.address, sweetToken.address],
		log: true
	});

	const sweetpadReserve = await getContract("SweetpadReserve");

	return sweetpadReserve;
};

module.exports.tags = ["sweetpadReserve", "dev"];
module.exports.dependencies = ["SweetpadToken"];