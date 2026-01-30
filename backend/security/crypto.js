/**
 * Low-level cryptographic utilities
 * Provides core crypto functions for the application
 */

const crypto = require('crypto');

// Encryption algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Generate a random encryption key
 * @param {number} length - Key length in bytes (default: 32)
 * @returns {Buffer} Random key
 */
function generateKey(length = KEY_LENGTH) {
  return crypto.randomBytes(length);
}

/**
 * Generate a random IV (Initialization Vector)
 * @param {number} length - IV length in bytes (default: 16)
 * @returns {Buffer} Random IV
 */
function generateIV(length = IV_LENGTH) {
  return crypto.randomBytes(length);
}

/**
 * Generate a random salt
 * @param {number} length - Salt length in bytes (default: 32)
 * @returns {Buffer} Random salt
 */
function generateSalt(length = SALT_LENGTH) {
  return crypto.randomBytes(length);
}

/**
 * Derive a key from a password using PBKDF2
 * @param {string} password - The password
 * @param {Buffer|string} salt - The salt
 * @param {number} iterations - Number of iterations (default: 100000)
 * @param {number} keyLength - Desired key length (default: 32)
 * @returns {Promise<Buffer>} Derived key
 */
function deriveKey(password, salt, iterations = ITERATIONS, keyLength = KEY_LENGTH) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Hash a password using PBKDF2
 * @param {string} password - The password to hash
 * @param {Buffer} salt - Optional salt (will generate if not provided)
 * @returns {Promise<Object>} Object with hash and salt
 */
async function hashPassword(password, salt = null) {
  if (!password) {
    throw new Error('Password is required');
  }

  const passwordSalt = salt || generateSalt();
  const hash = await deriveKey(password, passwordSalt, ITERATIONS, KEY_LENGTH);

  return {
    hash: hash.toString('hex'),
    salt: passwordSalt.toString('hex'),
    iterations: ITERATIONS
  };
}

/**
 * Verify a password against a hash
 * @param {string} password - The password to verify
 * @param {string} hash - The stored hash (hex string)
 * @param {string} salt - The stored salt (hex string)
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) {
    throw new Error('Password, hash, and salt are required');
  }

  const saltBuffer = Buffer.from(salt, 'hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  
  const derivedKey = await deriveKey(password, saltBuffer, ITERATIONS, KEY_LENGTH);
  
  return crypto.timingSafeEqual(hashBuffer, derivedKey);
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string|Buffer} data - Data to encrypt
 * @param {Buffer|string} key - Encryption key
 * @returns {Object} Encrypted data with iv and authTag
 */
function encrypt(data, key) {
  if (!data || !key) {
    throw new Error('Data and key are required for encryption');
  }

  const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex');
  const iv = generateIV();
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data (hex string)
 * @param {Buffer|string} key - Decryption key
 * @param {string} iv - Initialization vector (hex string)
 * @param {string} authTag - Authentication tag (hex string)
 * @returns {string} Decrypted data
 */
function decrypt(encryptedData, key, iv, authTag) {
  if (!encryptedData || !key || !iv || !authTag) {
    throw new Error('All parameters are required for decryption');
  }

  const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Random token as hex string
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  generateKey,
  generateIV,
  generateSalt,
  deriveKey,
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  generateToken,
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  SALT_LENGTH,
  ITERATIONS
};
