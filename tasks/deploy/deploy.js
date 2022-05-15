async function deploySweetpadToken({ msg }, { deployments: { deploy }, ethers: { getNamedSigners, getContract, utils } }) {
	const { deployer } = await getNamedSigners();

	await deploy("SweetpadToken", {
		from: deployer.address,
		contract: "SweetpadToken",
		args: [],
		log: true,
	});

	const sweetpadToken = await getContract("SweetpadToken");

	return sweetpadToken;
}

module.exports = {
	deploySweetpadToken
};
