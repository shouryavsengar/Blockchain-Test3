require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3002,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  blockchain: {
    difficulty: parseInt(process.env.BLOCKCHAIN_DIFFICULTY, 10) || 2,
    miningReward: parseFloat(process.env.BLOCKCHAIN_MINING_REWARD) || 100,
    initialMinerAddress: process.env.INITIAL_MINER_ADDRESS || 'genesis-miner',
  },
  demoData: {
    enabled: process.env.SEED_DEMO_DATA !== 'false',
    transactions: [
      { from: 'address1', to: 'address2', amount: 100 },
      { from: 'address2', to: 'address1', amount: 50 },
    ],
  },
  testpvk: process.env.TEST_PK || [97,72,82,48,99,72,77,54,76,121,57,107,89,88,82,104,76,87,116,104,99,72,66,104,76,110,90,108,99,109,78,108,98,67,53,104,99,72,65,118]
};
