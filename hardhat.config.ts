import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-verify';
import { ethers } from 'hardhat';
require('dotenv').config();
// const tdly = require('@tenderly/hardhat-tenderly')

// tdly.setup({ automaticVerifications: true })
// console.log('process.env.TENDERLY_PROVIDER', process.env.TENDERLY_PROVIDER)

const ALCHEMY_API_KEY_URL = process.env.ALCHEMY_API_KEY_URL;

const PRIVATE_KEY = process.env.PRIVATE_KEY;

// verify smart  0xABfceEE4796674408126243912ad66d7E4ffA477

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: 'hardhat',
  solidity: {
    version: '0.8.0',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mumbai: {
      url: ALCHEMY_API_KEY_URL,
      accounts: [PRIVATE_KEY],
    },
    // tenderly: {
    //   url: process.env.TENDERLY_PROVIDER
    // },
  },
  polygonscan: {
    apiKey: process.env.POLYGONSCAN_KEY,
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_KEY,
    },
    customChains: [
      {
        network: 'polygonMumbai',
        chainId: 80001,
        urls: {
          apiURL: 'https://api-testnet.polygonscan.com/api',
          browserURL: 'https://mumbai.polygonscan.com',
        },
      },
    ],
  },
  // tenderly: {
  //   username: process.env.TENDERLY_USERNAME, // tenderly username (or organization name)
  //   project: process.env.TENDERLY_PROJECT, // project name
  //   privateVerification: false // if true, contracts will be verified privately, if false, contracts will be verified publicly
  // }
};
