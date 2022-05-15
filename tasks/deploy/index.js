const { task } = require("hardhat/config");
const {
	deploySweetpadToken
} = require("./deploy");

task("deploy:sweetpadToken", "Deploy Sweetpad Token contract", deploySweetpadToken);
