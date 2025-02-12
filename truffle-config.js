const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

// Load environment variables
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  networks: {
    sepolia: {
        provider: () => new HDWalletProvider(PRIVATE_KEY, SEPOLIA_RPC_URL),
        network_id: 11155111,
        gas: 3000000,        // Reduce gas limit
        gasPrice: 5000000000 // Reduce gas price to 5 gwei
      },
    },
  compilers: {
    solc: {
      version: "0.8.21", // Match your Solidity version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
