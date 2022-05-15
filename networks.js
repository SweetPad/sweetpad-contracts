const IS_TEST_DEPLOY = process.env.IS_TEST_DEPLOY === "true";
console.log("🚀 ~ file: networks.js ~ line 2 ~ IS_TEST_DEPLOY", IS_TEST_DEPLOY)
const NETWORK_TAG = process.env.NETWORK_TAG === "Hardhat";

let tag = "Hardhat";
let deploy = "./deploy/hardhat";

if (IS_TEST_DEPLOY) {
	tag = NETWORK_TAG;
	deploy = "./deploy";
}

const FORKING_API_KEY = process.env.FORKING_API_KEY;
console.log("🚀 ~ file: networks.js ~ line 14 ~ FORKING_API_KEY", FORKING_API_KEY)

module.exports = {
	networks: {
		localhost: {
			chainId: 31337,
			url: "http://127.0.0.1:8545"
		},
		hardhat: {
			chainId: 31337,
			forking: {
				enabled: false,
				url: `https://bsc.getblock.io/mainnet/?api_key=${FORKING_API_KEY}`,
				blockNumber: 17827763
			},
			accounts: {
				mnemonic: "decide sphere amateur six misery tattoo happy cluster indoor topple clerk message",
				path: "m/44'/60'/0'/0",
				initialIndex: "0",
				count: "20"
			},
			// initialDate: new Date("01/01/2021"),
			allowUnlimitedContractSize: true,
			initialBaseFeePerGas: 0,
			tags: [tag],
			deploy: [deploy]
		},
		bsc: {
			chainId: 56,
			accounts: {
				mnemonic: "decide sphere amateur six misery tattoo happy cluster indoor topple clerk message",
				path: "m/44'/60'/0'/0",
				initialIndex: 0,
				count: 20
			},
			url: "https://bsc-dataseed.binance.org",
			tags: ["bsc"],
			deploy: ["./deploy/bsc"]
		},
		"bsc-testnet": {
			chainId: 97,
			gasMultiplier: 1,
			accounts: {
				mnemonic: "decide sphere amateur six misery tattoo happy cluster indoor topple clerk message",
				path: "m/44'/60'/0'/0",
				initialIndex: 0,
				count: 20
			},
			url: "https://data-seed-prebsc-2-s1.binance.org:8545/",
			tags: ["bsc-testnet"],
			deploy: ["./deploy/bsc-testnet"]
		},
		rinkeby: {
			chainId: 4,
			accounts: {
				mnemonic: "decide sphere amateur six misery tattoo happy cluster indoor topple clerk message",
				path: "m/44'/60'/0'/0",
				initialIndex: 0,
				count: 20
			},
			url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
			tags: ["rinkeby"],
			deploy: ["./deploy/rinkeby"]
		},
	},
	defaultConfig: {
		gasPrice: "auto"
	}
};
