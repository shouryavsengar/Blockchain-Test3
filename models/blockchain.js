const crypto = require('crypto');
const persistence = require('../services/persistence.service'); // persistence layer

/* ======================================================
   BLOCK CLASS
   Represents a single block in the blockchain
====================================================== */

class Block {

  constructor(timestamp, transactions, previousHash = '') {

    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;

    this.nonce = 0;

    this.hash = this.calculateHash();
  }

  /* Calculate SHA256 hash for block */

  calculateHash() {

    return crypto
      .createHash('sha256')
      .update(
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
      )
      .digest('hex');

  }

  /* Proof-of-Work mining */

  mineBlock(difficulty) {

    const target = Array(difficulty + 1).join('0');

    while (this.hash.substring(0, difficulty) !== target) {

      this.nonce++;

      this.hash = this.calculateHash();

    }

  }

  /* Validate all transactions in the block */

  hasValidTransactions() {

    for (const tx of this.transactions) {

      if (!tx.isValid()) return false;

    }

    return true;

  }

}


/* ======================================================
   TRANSACTION CLASS
====================================================== */

class Transaction {

  constructor(fromAddress, toAddress, amount) {

    this.fromAddress = fromAddress;
    this.toAddress = toAddress;

    this.amount = amount;

    this.timestamp = Date.now();

    this.signature = '';

  }

  /* Hash transaction content */

  calculateHash() {

    return crypto
      .createHash('sha256')
      .update(
        this.fromAddress +
        this.toAddress +
        this.amount +
        this.timestamp
      )
      .digest('hex');

  }

  /* Sign transaction using sender private key */

  signTransaction(signingKey) {

    const hashTx = this.calculateHash();

    const sig = signingKey.sign(hashTx, 'base64');

    this.signature = sig.toDER('hex');

  }

  /* Validate transaction */

  isValid() {

    /* Mining reward transaction */
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {

      return false;

    }

    return true;

  }

}


/* ======================================================
   BLOCKCHAIN CLASS
====================================================== */

class Blockchain {

  constructor(difficulty, miningReward) {

    this.chain = [this.createGenesisBlock()];

    this.difficulty = difficulty || 2;

    this.pendingTransactions = [];

    this.miningReward = miningReward || 100;

  }

  /* Create first block */

  createGenesisBlock() {

    return new Block(Date.now(), [], '0');

  }

  /* Return latest block */

  getLatestBlock() {

    return this.chain[this.chain.length - 1];

  }

  /* ======================================================
     MINE PENDING TRANSACTIONS
  ====================================================== */

  minePendingTransactions(miningRewardAddress) {

    if (!miningRewardAddress) {

      throw new Error('Miner address required');

    }

    /* Create mining reward transaction */

    const rewardTx = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward
    );

    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    /* Proof-of-Work */

    block.mineBlock(this.difficulty);

    this.chain.push(block);

    this.pendingTransactions = [];

    /* Persist blockchain */

    persistence.save(this);

  }


  /* ======================================================
     ADD TRANSACTION
  ====================================================== */

  addTransaction(transaction) {

    if (!transaction.fromAddress || !transaction.toAddress) {

      throw new Error('Transaction must include from and to address');

    }

    if (transaction.fromAddress === transaction.toAddress) {

      throw new Error('Cannot send transaction to the same address');

    }

    if (transaction.amount <= 0) {

      throw new Error('Transaction amount must be greater than zero');

    }

    if (!transaction.isValid()) {

      throw new Error('Cannot add invalid transaction to chain');

    }

    this.pendingTransactions.push(transaction);

    /* Persist blockchain */

    persistence.save(this);

  }


  /* ======================================================
     GET WALLET BALANCE
  ====================================================== */

  getBalanceOfAddress(address) {

    let balance = 0;

    for (const block of this.chain) {

      for (const trans of block.transactions) {

        if (trans.fromAddress === address) {

          balance -= trans.amount;

        }

        if (trans.toAddress === address) {

          balance += trans.amount;

        }

      }

    }

    return balance;

  }


  /* ======================================================
     CHAIN VALIDATION
  ====================================================== */

  isChainValid() {

    for (let i = 1; i < this.chain.length; i++) {

      const current = this.chain[i];

      const previous = this.chain[i - 1];

      if (!current.hasValidTransactions()) return false;

      if (current.hash !== current.calculateHash()) return false;

      if (current.previousHash !== previous.hash) return false;

    }

    return true;

  }


  /* ======================================================
     GET ALL TRANSACTIONS
  ====================================================== */

  getAllTransactions() {

    return this.chain.flatMap(block => block.transactions);

  }

}

module.exports = { Blockchain, Block, Transaction };