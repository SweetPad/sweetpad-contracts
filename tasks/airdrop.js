const excelToJson = require("convert-excel-to-json");
const { toChecksumAddress } = require("ethereum-checksum-address");
module.exports = async function ({ path }, { ethers }) {
	const parsedData = excelToJson({
		sourceFile: path,
		columnToKey: {
			"*": "{{columnHeader}}"
		}
	});
	const sweetToken = await ethers.getContractAt("SweetpadToken", "0xE8EbCf4Fd1faa9B77c0ec0B26e7Cc32a251Cd799");
	console.log(parsedData["Airdrop Wallets"].length);
	for (let i = 5740; i < parsedData["Airdrop Wallets"].length; i++) {
		await sweetToken
			.transfer(toChecksumAddress(`${parsedData["Airdrop Wallets"][i].wallet}`), ethers.utils.parseUnits("10"))
			.then((tx) => tx.wait());
		console.log(`Tokens transfered to ${parsedData["Airdrop Wallets"][i].wallet}, ${i}`);
	}
};
