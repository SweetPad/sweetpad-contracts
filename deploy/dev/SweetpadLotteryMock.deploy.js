module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	await deploy("SweetpadLotteryMock", {
		from: deployer.address,
		contract: "SweetpadLotteryMock",
		args: [10, 11],
		log: true
	});

	const sweetpadLottery = await getContract("SweetpadLotteryMock");

	return sweetpadLottery;
};

module.exports.tags = ["SweetpadLotteryMock", "dev"];
