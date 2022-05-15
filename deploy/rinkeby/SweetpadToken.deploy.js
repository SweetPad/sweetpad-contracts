module.exports = async ({
	run
}) => {
	await run("deploy:sweetpadToken");
};
module.exports.tags = ["SweetpadToken", "rinkeby"];
