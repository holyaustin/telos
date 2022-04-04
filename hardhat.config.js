require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  solidity: '0.8.10',
  networks: {
    telos: {
      url: 'https://testnet.telos.net/evm',
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      chainId: 1,
      url: 'https://rpc1.eu.telos.net/evm',
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
