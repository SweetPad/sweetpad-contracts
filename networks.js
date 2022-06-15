const FORKING_API_KEY = process.env.FORKING_API_KEY || "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";

module.exports = {
	networks: {
		localhost: {
			chainId: 31337,
			url: "http://127.0.0.1:8545",
			tags: ["dev"],
			deploy: ["./deploy/dev"]
		},
		hardhat: {
			chainId: 31337,
			forking: {
				enabled: false,
				url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
				blockNumber: 14938317
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
			tags: ["dev"],
			deploy: ["./deploy/dev"],
			env: {
				name: "test variable"
			}
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
			tags: ["prod"],
			deploy: ["./deploy/prod"]
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
			tags: ["stage"],
			deploy: ["./deploy/stage"]
		},
		rinkeby: {
			chainId: 4,
			accounts: {
				mnemonic: "decide sphere amateur six misery tattoo happy cluster indoor topple clerk message",
				path: "m/44'/60'/0'/0",
				initialIndex: 0,
				count: 20
			},
			url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
			tags: ["stage"],
			deploy: ["./deploy/stage"]
		}
	},
	defaultConfig: {
		gasPrice: "auto"
	}
};
