module.exports = async function ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) {
	const { deployer } = await getNamedSigners();
	let sweetpadNFTFreezing;

	const sweetpadNFT = await getContract("SweetpadNFT");
	const sweetpadTicket = await getContract("SweetpadTicket");

	try {
		await deploy("SweetpadNFTFreezing", {
			from: deployer.address,
			contract: "SweetpadNFTFreezing",
			args: [sweetpadNFT.address, sweetpadTicket.address],
			log: true,
		});

		sweetpadNFTFreezing = await getContract("SweetpadNFTFreezing");

		// await sweetpadNFTFreezing.transferOwnership(owner.address).then((tx) => tx.wait());
		// await sweetpadTicket.transferOwnership(sweetpadNFTFreezing.address).then((tx) => tx.wait());
	} catch (error) {
		throw error.message;
	}

	return sweetpadNFTFreezing;
};

module.exports.tags = ["SweetpadNFTFreezing", "stage"];
module.exports.dependencies = ["SweetpadTicket"];