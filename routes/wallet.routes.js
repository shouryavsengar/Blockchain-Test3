const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");

// POST /api/wallets
router.post("/", walletController.createWallet);

module.exports = router;