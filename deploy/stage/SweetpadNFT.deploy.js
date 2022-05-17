module.exports = async function ({ deployments: { deploy }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	await deploy("SweetpadNFT", {
		from: deployer.address,
		contract: "SweetpadNFT",
		args: [],
		log: true,
	});
};
module.exports.tags = ["SweetpadNFT", "stage"];