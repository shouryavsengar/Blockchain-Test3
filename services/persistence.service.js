const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const FILE = path.join(process.cwd(), "blockchain.json");

/**
 * Save blockchain state
 */
async function save(blockchain) {

  try {

    const data = JSON.stringify({
      chain: blockchain.chain,
      pendingTransactions: blockchain.pendingTransactions
    });

    await fs.promises.writeFile(FILE, data);

    logger.info("Blockchain saved");

  } catch (err) {

    logger.error("Failed to save blockchain", err);

  }
}

/**
 * Load blockchain state
 */
async function load() {

  try {

    if (!fs.existsSync(FILE)) {
      return null;
    }

    const data = await fs.promises.readFile(FILE);

    return JSON.parse(data);

  } catch (err) {

    logger.warn("Failed to load blockchain");

    return null;

  }
}

/**
 * Clear blockchain storage
 */
async function clear() {

  try {

    if (fs.existsSync(FILE)) {
      await fs.promises.unlink(FILE);
    }

  } catch (err) {

    logger.error("Failed to clear blockchain");

  }
}

module.exports = { save, load, clear };