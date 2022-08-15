module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	await deploy("RandomNumberGenerator", {
		from: deployer.address,
		contract: "RandomNumberGenerator",
		args: [],
		log: true
	});

	const randomNumberGenerator = await getContract("RandomNumberGenerator");

	return randomNumberGenerator;
};

module.exports.tags = ["RandomNumberGenerator", "dev"];
