const { blockchain, Transaction } = require('../models');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { isValidAddress, isValidAmount, sanitizeAddress, sanitizeAmount } = require('../utils/validator');

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const addTransaction = (req, res, next) => {
  try {

    const { fromAddress, toAddress, amount, privateKey } = req.body;

    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount)
    );

    /*
      --------------------------------
      SIGN TRANSACTION (NEW LOGIC)
      --------------------------------
    */

    if (!privateKey) {
      return sendError(res, 'Private key required to sign transaction', 400);
    }

    // Remove PEM header/footer
    const cleanKey = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\n/g, '')
      .trim();

    const key = ec.keyFromPrivate(cleanKey, 'hex');

    transaction.signTransaction(key);

    /*
      --------------------------------
      ADD TO BLOCKCHAIN
      --------------------------------
    */

    blockchain.addTransaction(transaction);

    sendCreated(res, {
      message: 'Transaction added to pending pool',
      transaction,
    });

  } catch (err) {
    next(err);
  }
};

const getPendingTransactions = (req, res) => {
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

const getAllTransactions = (req, res) => {
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

module.exports = { addTransaction, getPendingTransactions, getAllTransactions };