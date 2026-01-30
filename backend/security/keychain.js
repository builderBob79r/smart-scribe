/**
 * Keychain module for secure storage of encryption keys
 * Uses keytar for secure credential storage
 */

const SERVICE_NAME = 'smart-scribe-app';
const ENCRYPTION_KEY_ACCOUNT = 'encryption-key';

let keytar;
let isKeytarAvailable = false;

// Try to load keytar, but handle gracefully if not available
try {
  keytar = require('keytar');
  isKeytarAvailable = true;
} catch (error) {
  console.warn('Keytar not available, using fallback storage:', error.message);
}

// Fallback in-memory storage (NOT secure, only for development/testing)
const fallbackStorage = new Map();

/**
 * Store the encryption key securely
 * @param {string} key - The encryption key to store
 * @param {string} accountName - Optional account name (default: 'encryption-key')
 * @returns {Promise<boolean>} True if successful
 */
async function storeKey(key, accountName = ENCRYPTION_KEY_ACCOUNT) {
  if (!key || typeof key !== 'string') {
    throw new Error('Key must be a non-empty string');
  }

  try {
    if (isKeytarAvailable && keytar) {
      await keytar.setPassword(SERVICE_NAME, accountName, key);
      console.log('Encryption key stored securely in system keychain');
      return true;
    } else {
      // Fallback storage
      fallbackStorage.set(accountName, key);
      console.warn('Encryption key stored in memory (fallback mode - not secure)');
      return true;
    }
  } catch (error) {
    console.error('Failed to store encryption key:', error);
    throw new Error(`Failed to store key: ${error.message}`);
  }
}

/**
 * Retrieve the encryption key
 * @param {string} accountName - Optional account name (default: 'encryption-key')
 * @returns {Promise<string|null>} The encryption key or null if not found
 */
async function retrieveKey(accountName = ENCRYPTION_KEY_ACCOUNT) {
  try {
    if (isKeytarAvailable && keytar) {
      const key = await keytar.getPassword(SERVICE_NAME, accountName);
      return key;
    } else {
      // Fallback storage
      return fallbackStorage.get(accountName) || null;
    }
  } catch (error) {
    console.error('Failed to retrieve encryption key:', error);
    throw new Error(`Failed to retrieve key: ${error.message}`);
  }
}

/**
 * Delete the encryption key
 * @param {string} accountName - Optional account name (default: 'encryption-key')
 * @returns {Promise<boolean>} True if successful
 */
async function deleteKey(accountName = ENCRYPTION_KEY_ACCOUNT) {
  try {
    if (isKeytarAvailable && keytar) {
      const result = await keytar.deletePassword(SERVICE_NAME, accountName);
      console.log('Encryption key deleted from system keychain');
      return result;
    } else {
      // Fallback storage
      const existed = fallbackStorage.has(accountName);
      fallbackStorage.delete(accountName);
      return existed;
    }
  } catch (error) {
    console.error('Failed to delete encryption key:', error);
    throw new Error(`Failed to delete key: ${error.message}`);
  }
}

/**
 * Check if an encryption key exists
 * @param {string} accountName - Optional account name (default: 'encryption-key')
 * @returns {Promise<boolean>} True if key exists
 */
async function hasKey(accountName = ENCRYPTION_KEY_ACCOUNT) {
  try {
    const key = await retrieveKey(accountName);
    return key !== null;
  } catch (error) {
    console.error('Failed to check for encryption key:', error);
    return false;
  }
}

/**
 * Store a passphrase securely
 * @param {string} passphrase - The passphrase to store
 * @param {string} accountName - Account name
 * @returns {Promise<boolean>} True if successful
 */
async function storePassphrase(passphrase, accountName = 'master-passphrase') {
  return await storeKey(passphrase, accountName);
}

/**
 * Retrieve a passphrase
 * @param {string} accountName - Account name
 * @returns {Promise<string|null>} The passphrase or null
 */
async function retrievePassphrase(accountName = 'master-passphrase') {
  return await retrieveKey(accountName);
}

/**
 * Delete a passphrase
 * @param {string} accountName - Account name
 * @returns {Promise<boolean>} True if successful
 */
async function deletePassphrase(accountName = 'master-passphrase') {
  return await deleteKey(accountName);
}

/**
 * Check if keytar is available
 * @returns {boolean} True if keytar is available
 */
function isSecureStorageAvailable() {
  return isKeytarAvailable;
}

/**
 * Clear all fallback storage (for testing)
 */
function clearFallbackStorage() {
  fallbackStorage.clear();
}

module.exports = {
  storeKey,
  retrieveKey,
  deleteKey,
  hasKey,
  storePassphrase,
  retrievePassphrase,
  deletePassphrase,
  isSecureStorageAvailable,
  clearFallbackStorage,
  SERVICE_NAME,
  ENCRYPTION_KEY_ACCOUNT
};
