/**
 * Encryption module for database content
 * Uses AES-256-GCM for encrypting/decrypting note content
 */

const CryptoJS = require('crypto-js');
const { encrypt: cryptoEncrypt, decrypt: cryptoDecrypt } = require('../security/crypto');

/**
 * Encrypt note content using AES-256-GCM
 * @param {string} content - The content to encrypt
 * @param {string} encryptionKey - The encryption key (hex string)
 * @returns {Object} Encrypted data with metadata
 */
function encryptContent(content, encryptionKey) {
  if (!content) {
    throw new Error('Content is required for encryption');
  }

  if (!encryptionKey) {
    throw new Error('Encryption key is required');
  }

  try {
    // Use the crypto module's encrypt function for consistency
    const encrypted = cryptoEncrypt(content, encryptionKey);

    return {
      content: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      encryptedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Failed to encrypt content: ${error.message}`);
  }
}

/**
 * Decrypt note content using AES-256-GCM
 * @param {string} encryptedContent - The encrypted content
 * @param {string} encryptionKey - The encryption key (hex string)
 * @param {string} iv - The initialization vector (hex string)
 * @param {string} authTag - The authentication tag (hex string)
 * @returns {string} Decrypted content
 */
function decryptContent(encryptedContent, encryptionKey, iv, authTag) {
  if (!encryptedContent || !encryptionKey || !iv || !authTag) {
    throw new Error('All parameters are required for decryption');
  }

  try {
    // Use the crypto module's decrypt function for consistency
    const decrypted = cryptoDecrypt(encryptedContent, encryptionKey, iv, authTag);
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(`Failed to decrypt content: ${error.message}`);
  }
}

/**
 * Encrypt note content using CryptoJS (alternative method)
 * @param {string} content - The content to encrypt
 * @param {string} passphrase - The passphrase/key
 * @returns {string} Encrypted content as string
 */
function encryptWithCryptoJS(content, passphrase) {
  if (!content || !passphrase) {
    throw new Error('Content and passphrase are required');
  }

  try {
    const encrypted = CryptoJS.AES.encrypt(content, passphrase);
    return encrypted.toString();
  } catch (error) {
    console.error('CryptoJS encryption failed:', error);
    throw new Error(`Failed to encrypt with CryptoJS: ${error.message}`);
  }
}

/**
 * Decrypt note content using CryptoJS (alternative method)
 * @param {string} encryptedContent - The encrypted content
 * @param {string} passphrase - The passphrase/key
 * @returns {string} Decrypted content
 */
function decryptWithCryptoJS(encryptedContent, passphrase) {
  if (!encryptedContent || !passphrase) {
    throw new Error('Encrypted content and passphrase are required');
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, passphrase);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Decryption produced empty result - wrong key or corrupted data');
    }
    
    return plaintext;
  } catch (error) {
    console.error('CryptoJS decryption failed:', error);
    throw new Error(`Failed to decrypt with CryptoJS: ${error.message}`);
  }
}

/**
 * Encrypt note metadata (title, tags, etc.)
 * @param {Object} metadata - The metadata object to encrypt
 * @param {string} encryptionKey - The encryption key
 * @returns {Object} Encrypted metadata
 */
function encryptMetadata(metadata, encryptionKey) {
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('Metadata must be an object');
  }

  const metadataString = JSON.stringify(metadata);
  return encryptContent(metadataString, encryptionKey);
}

/**
 * Decrypt note metadata
 * @param {string} encryptedMetadata - The encrypted metadata
 * @param {string} encryptionKey - The encryption key
 * @param {string} iv - The initialization vector
 * @param {string} authTag - The authentication tag
 * @returns {Object} Decrypted metadata object
 */
function decryptMetadata(encryptedMetadata, encryptionKey, iv, authTag) {
  const decryptedString = decryptContent(encryptedMetadata, encryptionKey, iv, authTag);
  
  try {
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Failed to parse decrypted metadata:', error);
    throw new Error('Failed to parse decrypted metadata');
  }
}

/**
 * Batch encrypt multiple contents
 * @param {string[]} contents - Array of contents to encrypt
 * @param {string} encryptionKey - The encryption key
 * @returns {Object[]} Array of encrypted data objects
 */
function batchEncrypt(contents, encryptionKey) {
  if (!Array.isArray(contents)) {
    throw new Error('Contents must be an array');
  }

  return contents.map(content => {
    try {
      return encryptContent(content, encryptionKey);
    } catch (error) {
      console.error('Failed to encrypt content in batch:', error);
      return null;
    }
  });
}

/**
 * Batch decrypt multiple contents
 * @param {Object[]} encryptedContents - Array of encrypted content objects
 * @param {string} encryptionKey - The encryption key
 * @returns {string[]} Array of decrypted contents
 */
function batchDecrypt(encryptedContents, encryptionKey) {
  if (!Array.isArray(encryptedContents)) {
    throw new Error('Encrypted contents must be an array');
  }

  return encryptedContents.map(item => {
    try {
      return decryptContent(item.content, encryptionKey, item.iv, item.authTag);
    } catch (error) {
      console.error('Failed to decrypt content in batch:', error);
      return null;
    }
  });
}

module.exports = {
  encryptContent,
  decryptContent,
  encryptWithCryptoJS,
  decryptWithCryptoJS,
  encryptMetadata,
  decryptMetadata,
  batchEncrypt,
  batchDecrypt
};
