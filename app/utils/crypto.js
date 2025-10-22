"use strict";

// Simple AES-256-GCM encryption/decryption helpers for tokens
// Requires process.env.TOKENS_CRYPTO_KEY to be a 32-byte key provided as
// base64 (preferred) or hex. Never hardcode the key.

const crypto = require("crypto");

function getKey() {
  const raw = process.env.TOKENS_CRYPTO_KEY;
  if (!raw) {
    throw new Error("TOKENS_CRYPTO_KEY not configured. Provide a 32-byte key (base64 or hex)");
  }

  // Try base64 first
  try {
    const b64 = Buffer.from(raw, "base64");
    if (b64.length === 32) return b64;
  } catch (_) {}

  // Then try hex
  try {
    const hex = Buffer.from(raw, "hex");
    if (hex.length === 32) return hex;
  } catch (_) {}

  // As a last resort, derive a 32-byte key from the provided string via scrypt
  // This allows using a passphrase, but base64/hex 32-byte key is recommended.
  return crypto.scryptSync(raw, "tokens_salt", 32);
}

// Returns string in the form base64(iv).base64(ciphertext).base64(tag)
function encryptToken(plaintext) {
  if (typeof plaintext !== "string") {
    throw new Error("encryptToken requires a string");
  }
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${enc.toString("base64")}.${tag.toString("base64")}`;
}

function decryptToken(pack) {
  
  if (typeof pack !== "string" || pack.split(".").length !== 3) {
    throw new Error("Invalid encrypted token format");
  }
  const [ivB64, dataB64, tagB64] = pack.split(".");
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

module.exports = {
  encryptToken,
  decryptToken,
};
