module.exports = async ({deployments: { deploy }, ethers: { getNamedSigners, getContract }}) => {
	const { deployer } = await getNamedSigners();

	await deploy("SweetpadToken", {
		from: deployer.address,
		contract: "SweetpadToken",
		args: [],
		log: true,
	});

	const sweetpadToken = await getContract("SweetpadToken");

	await deploy("lpToken", {
		from: deployer.address,
		contract: "SweetpadToken",
		args: [],
		log: true,
	});

	const lpToken = await getContract("lpToken");

	return [lpToken, sweetpadToken];
};
module.exports.tags = ["SweetpadToken", "dev"];
