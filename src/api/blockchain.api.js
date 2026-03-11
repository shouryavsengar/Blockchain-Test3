import client from './client';
import ENDPOINTS from './endpoints';
import axios from 'axios';

export const fetchChain = () => client.get(ENDPOINTS.CHAIN);

export const fetchChainValidity = () => client.get(ENDPOINTS.CHAIN_VALID);

export const fetchStats = () => client.get(ENDPOINTS.STATS);

export const fetchPendingTransactions = () =>
  client.get(ENDPOINTS.TRANSACTIONS_PENDING);

export const fetchAllTransactions = () =>
  client.get(ENDPOINTS.TRANSACTIONS_ALL);

  export const addTransaction = (fromAddress, toAddress, amount, privateKey) => {
    return axios.post('/api/transactions', {
      fromAddress,
      toAddress,
      amount,
      privateKey
    });
  };

export const mineBlock = (miningRewardAddress = 'miner1') =>
  client.post(ENDPOINTS.MINE, { miningRewardAddress });

export const fetchBalance = (address) =>
  client.get(ENDPOINTS.balance(address));

export const fetchDashboard = () =>
  Promise.all([fetchChain(), fetchStats()]).then(([chainData, statsData]) => ({
    chainData,
    statsData,
  }));
