module.exports = async function ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) {
	const { deployer, owner } = await getNamedSigners();
	let sweetpadNFT;
	
	try {
		await deploy("SweetpadNFT", {
			from: deployer.address,
			contract: "SweetpadNFT",
			args: [],
			log: true,
		});

		sweetpadNFT = await getContract("SweetpadNFT");

		await sweetpadNFT.transferOwnership(owner.address).then((tx) => tx.wait());
	} catch (error) {
		throw error.message;
	}

	return sweetpadNFT;
};

module.exports.tags = ["SweetpadNFT", "stage"];