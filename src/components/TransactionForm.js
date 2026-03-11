import React, { useState } from 'react';
import './TransactionForm.css';
import axios from 'axios';
import { addTransaction } from '../api/blockchain.api';

const TransactionForm = ({ onTransactionAdded }) => {

  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);

  const [formData, setFormData] = useState({
    fromAddress: '',
    toAddress: '',
    amount: '',
  });

  const [privateKeyVault, setPrivateKeyVault] = useState('');

  const [checkAddress, setCheckAddress] = useState('');
  const [checkBalance, setCheckBalance] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  /* ===========================
     MINE BLOCK
  =========================== */

  const mineBlock = async (address) => {

    try {
  
      await axios.post('/api/mine', {
        minerAddress: address
      });
  
      // refresh balance after mining
      await fetchBalance(address);
  
    } catch (err) {
  
      console.log('Mining failed', err);
  
    }
  };

  /* ===========================
     Generate Wallet
  =========================== */

  const generateWallet = async () => {

    setLoading(true);
    setMessage('');

    try {

      const res = await axios.post('/api/wallets');

      const generatedWallet = res.data;

      setWallet(generatedWallet);

      setPrivateKeyVault(generatedWallet.privateKey);

      setFormData({
        ...formData,
        fromAddress: generatedWallet.address
      });

      /* GIVE 100 COINS TO THIS WALLET */

     /* 
      Mine twice so reward becomes spendable
      First mine creates reward transaction
      Second mine confirms reward
    */

    await mineBlock(generatedWallet.address);
    await mineBlock(generatedWallet.address);

      /* FETCH UPDATED BALANCE */

      await fetchBalance(generatedWallet.address);

      setMessage('Wallet created and rewarded with 100 coins');

    } catch {

      setMessage('Failed to generate wallet');

    } finally {

      setLoading(false);

    }
  };

  /* ===========================
     Fetch Wallet Balance
  =========================== */

  const fetchBalance = async (address) => {

    try {

      const encodedAddress = encodeURIComponent(address);

      const res = await axios.get(`/api/balance/${encodedAddress}`);

      setBalance(res.data.balance);

    } catch {

      setBalance(null);

    }
  };

  /* ===========================
     Check Any Wallet Balance
  =========================== */

  const handleCheckBalance = async () => {

    if (!checkAddress) return;

    try {

      const encodedAddress = encodeURIComponent(checkAddress);

      const res = await axios.get(`/api/balance/${encodedAddress}`);

      setCheckBalance(res.data.balance);

    } catch {

      setCheckBalance(null);

    }
  };

  /* ===========================
     Validate Address
  =========================== */

  const isValidAddress = (address) => {

    return /^[0-9a-fA-F]{40}$/.test(address);

  };

  /* ===========================
     Form Change
  =========================== */

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setMessage('');
  };

  /* ===========================
     Submit Transaction
  =========================== */

  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage('');

    if (!isValidAddress(formData.toAddress)) {
      setMessage('Invalid receiver address');
      return;
    }

    // if (!balance || Number(formData.amount) > Number(balance)) {

    //   setMessage('Insufficient balance');
    
    //   return;
    
    // } 

    setLoading(true);

    try {

      /* ADD TRANSACTION */

      await addTransaction(
        formData.fromAddress,
        formData.toAddress,
        formData.amount,
        privateKeyVault
      );

      /* MINE BLOCK AFTER TRANSACTION */

      await mineBlock("genesis-miner");

      /* refresh sender balance */
      
      await fetchBalance(formData.fromAddress);

      setMessage('Transaction successful and block mined');

      setFormData({
        ...formData,
        toAddress: '',
        amount: ''
      });

      await fetchBalance(formData.fromAddress);

      if (onTransactionAdded) onTransactionAdded();

    } catch (err) {

      setMessage(err.message || 'Transaction failed');

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="transaction-form">

      <h2 className="panel-title">Wallet & Transaction</h2>

      {/* WALLET */}

      <button onClick={generateWallet} className="submit-button">
        Generate Wallet
      </button>

      {wallet && (
        <>
          <div className="form-group">
            <label>Wallet Address</label>
            <input value={wallet.address} readOnly />
          </div>

          <div className="form-group">
            <label>Public Key</label>
            <input value={wallet.publicKey} readOnly style={{ width: '100%' }} />
          </div>

          <div className="form-message success">
            Balance: {balance !== null ? balance : 'Loading...'}
          </div>
        </>
      )}

      {/* CHECK BALANCE */}

      <div className="form-group">
        <label>Check Wallet Balance</label>
        <input
          value={checkAddress}
          onChange={(e) => setCheckAddress(e.target.value)}
          placeholder="Enter wallet address"
        />
      </div>

      <button onClick={handleCheckBalance} className="submit-button mb20">
        Check Balance
      </button>

      {checkBalance !== null && (
        <div className="form-message success">
          Balance: {checkBalance}
        </div>
      )}

      {/* TRANSACTION */}

      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label>From Address</label>
          <input
            name="fromAddress"
            value={formData.fromAddress}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>To Address</label>
          <input
            name="toAddress"
            value={formData.toAddress}
            onChange={handleChange}
            placeholder="Receiver wallet address"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Amount"
            required
          />
        </div>

        {message && (
          <div className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Processing...' : 'Send Transaction'}
        </button>

      </form>

    </div>
  );
};

export default TransactionForm;