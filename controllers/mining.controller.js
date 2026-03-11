const { blockchain } = require('../models');
const { sendSuccess } = require('../utils/response');
const logger = require('../utils/logger');

const mineBlock = (req, res, next) => {
  try {
    const miningRewardAddress = req.body.miningRewardAddress || 'miner1';

    logger.info(`Mining block for reward address: ${miningRewardAddress}`);
    blockchain.minePendingTransactions(miningRewardAddress);
    logger.info(`Block mined successfully: ${blockchain.getLatestBlock().hash}`);

    sendSuccess(res, {
      message: 'Block mined successfully',
      latestBlock: blockchain.getLatestBlock(),
      chainLength: blockchain.chain.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { mineBlock };
