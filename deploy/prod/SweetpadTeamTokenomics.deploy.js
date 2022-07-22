module.exports = async ({ deployments: { deploy }, ethers: { getNamedSigners, getContract } }) => {
	const { deployer } = await getNamedSigners();
	await deploy("SweetpadTeamTokenomics", {
		from: deployer.address,
		contract: "SweetpadTeamTokenomics",
		args: ["0xda0f4027e61C09F74ac67a763e196Ae22a163e1A", "0xE8EbCf4Fd1faa9B77c0ec0B26e7Cc32a251Cd799"],
		log: true
	});

	const sweetpadTeamTokenomics = await getContract("SweetpadTeamTokenomics");

	return sweetpadTeamTokenomics;
};

module.exports.tags = ["SweetpadTeamTokenomics1", "prod"];