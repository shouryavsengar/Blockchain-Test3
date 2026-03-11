const crypto = require("crypto");
const { sendSuccess } = require("../utils/response");

exports.createWallet = (req, res) => {

  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem"
    }
  });

  // create wallet address
  const address = crypto
    .createHash("sha256")
    .update(publicKey)
    .digest("hex")
    .slice(0, 40);   // shorter address

  return sendSuccess(res, {
    address,
    publicKey,
    privateKey
  });
};