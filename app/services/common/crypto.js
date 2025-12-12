"use strict";

// Simple AES-256-GCM encryption/decryption helpers for tokens
// Requires process.env.TOKENS_CRYPTO_KEY to be a 32-byte key provided as
// base64 (preferred) or hex. Never hardcode the key.

const crypto = require("crypto");

/**
 * Retrieves and validates the encryption key from environment variables.
 * Tries to parse TOKENS_CRYPTO_KEY as base64 or hex, falling back to scrypt derivation.
 * @returns {Buffer} A 32-byte encryption key
 * @throws {Error} If TOKENS_CRYPTO_KEY is not configured
 */
const getKey = () => {
  const raw = process.env.TOKENS_CRYPTO_KEY;
  if (!raw) {
    throw new Error("TOKENS_CRYPTO_KEY not configured. Provide a 32-byte key (base64 or hex)");
  }

  // Try base64 first
  try {
    const b64 = Buffer.from(raw, "base64");
    if (b64.length === 32) return b64;
  } catch (_) { }

  // Then try hex
  try {
    const hex = Buffer.from(raw, "hex");
    if (hex.length === 32) return hex;
  } catch (_) { }

  // As a last resort, derive a 32-byte key from the provided string via scrypt
  // This allows using a passphrase, but base64/hex 32-byte key is recommended.
  return crypto.scryptSync(raw, "tokens_salt", 32);
}

/**
 * Encrypts a plaintext token using AES-256-GCM encryption.
 * @param {string} plaintext - The plaintext string to encrypt
 * @returns {string} Encrypted token in the format: base64(iv).base64(ciphertext).base64(tag)
 * @throws {Error} If plaintext is not a string
 */
const encryptToken = (plaintext) => {
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

/**
 * Decrypts a previously encrypted token using AES-256-GCM.
 * @param {string} pack - Encrypted token string in format: base64(iv).base64(ciphertext).base64(tag)
 * @returns {string} The decrypted plaintext token
 * @throws {Error} If the encrypted token format is invalid
 */
const decryptToken = (pack) => {

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
