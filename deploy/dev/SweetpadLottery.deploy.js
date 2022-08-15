module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	await deploy("SweetpadLottery", {
		from: deployer.address,
		contract: "SweetpadLottery",
		args: [],
		log: true
	});

	const sweetpadLottery = await getContract("SweetpadLottery");

	return sweetpadLottery;
};

module.exports.tags = ["SweetpadLottery", "dev"];
