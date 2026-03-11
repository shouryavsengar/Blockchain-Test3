const { blockchain, Transaction } = require('../models');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { isValidAddress, isValidAmount, sanitizeAddress, sanitizeAmount } = require('../utils/validator');
const logger = require('../utils/logger');

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const addTransaction = (req, res, next) => {
  try {

    const { fromAddress, toAddress, amount, privateKey } = req.body;

    logger.info('Transaction request received: ${fromAddress} -> ${toAddress}, amount=${amount}');

    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      logger.warn('Invalid wallet address format');
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      logger.warn('Invalid transaction amount: ${amount}');
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
      logger.warn('Transaction rejected: private key missing');
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

    logger.info('Transaction added to pending pool: ${transaction.fromAddress} -> ${transaction.toAddress}');

    sendCreated(res, {
      message: 'Transaction added to pending pool',
      transaction,
    });

  } catch (err) {

    logger.error('Transaction processing failed: ${err.message}');

    next(err);
  }
};

const getPendingTransactions = (req, res) => {
  logger.info('Fetching pending transactions');
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

const getAllTransactions = (req, res) => {
  logger.info('Fetching all blockchain transactions');
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

module.exports = { addTransaction, getPendingTransactions, getAllTransactions };