const { task } = require("hardhat/config");
require("./utils");

task("airdrop", "transfers assets to users")
	.addParam("path", "path to the configuration file with NFT tiers", "tasks/config/airdropWallets.xlsx")
	.setAction(require("./airdrop"));