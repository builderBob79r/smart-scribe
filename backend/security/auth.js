/**
 * Authentication module
 * Handles password setup, verification, and changes
 * Uses PBKDF2 for password hashing and keytar for secure storage
 */

const { hashPassword, verifyPassword, generateKey } = require('./crypto');
const { storeKey, retrieveKey, deleteKey } = require('./keychain');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const AUTH_FILE = path.join(process.cwd(), 'data', 'auth.json');
const PASSWORD_HASH_ACCOUNT = 'master-password-hash';
const PASSWORD_SALT_ACCOUNT = 'master-password-salt';

// Rate limiting for brute force protection
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
let failedAttempts = 0;
let lockoutUntil = null;

/**
 * Check if account is locked due to failed attempts
 * @returns {Object} Lock status
 */
function checkLockoutStatus() {
  if (lockoutUntil && Date.now() < lockoutUntil) {
    const remainingMs = lockoutUntil - Date.now();
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    return {
      locked: true,
      remainingSeconds: remainingSeconds
    };
  }
  
  // Reset if lockout period has passed
  if (lockoutUntil && Date.now() >= lockoutUntil) {
    failedAttempts = 0;
    lockoutUntil = null;
  }
  
  return { locked: false };
}

/**
 * Record a failed authentication attempt
 */
function recordFailedAttempt() {
  failedAttempts++;
  console.warn(`Failed authentication attempt ${failedAttempts}/${MAX_FAILED_ATTEMPTS}`);
  
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    console.error(`Account locked due to too many failed attempts. Locked until ${new Date(lockoutUntil).toISOString()}`);
  }
}

/**
 * Reset failed attempts counter (call after successful authentication)
 */
function resetFailedAttempts() {
  failedAttempts = 0;
  lockoutUntil = null;
}

/**
 * Ensure data directory exists
 */
async function ensureDataDirectory() {
  const dataDir = path.dirname(AUTH_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Store auth data to file (as backup to keychain)
 * @param {Object} authData - Authentication data
 */
async function storeAuthData(authData) {
  await ensureDataDirectory();
  await fs.writeFile(AUTH_FILE, JSON.stringify(authData, null, 2));
}

/**
 * Load auth data from file
 * @returns {Promise<Object|null>} Auth data or null
 */
async function loadAuthData() {
  try {
    const data = await fs.readFile(AUTH_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Set up the master password
 * @param {string} password - The master password
 * @returns {Promise<Object>} Setup result with encryption key
 */
async function setupPassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  // Check if password already exists
  const existingAuth = await loadAuthData();
  if (existingAuth && existingAuth.initialized) {
    throw new Error('Password already set up. Use changePassword() to change it.');
  }

  try {
    // Hash the password
    const { hash, salt, iterations } = await hashPassword(password);

    // Generate encryption key for database
    const encryptionKey = generateKey();
    const encryptionKeyHex = encryptionKey.toString('hex');

    // Store in keychain
    await storeKey(hash, PASSWORD_HASH_ACCOUNT);
    await storeKey(salt, PASSWORD_SALT_ACCOUNT);
    await storeKey(encryptionKeyHex, 'encryption-key');

    // Store metadata in file
    const authData = {
      initialized: true,
      createdAt: new Date().toISOString(),
      iterations: iterations,
      version: '1.0'
    };
    await storeAuthData(authData);

    console.log('Master password set up successfully');

    return {
      success: true,
      encryptionKey: encryptionKeyHex
    };
  } catch (error) {
    console.error('Failed to setup password:', error);
    throw new Error(`Password setup failed: ${error.message}`);
  }
}

/**
 * Verify the master password
 * @param {string} password - The password to verify
 * @returns {Promise<Object>} Verification result with encryption key if successful
 */
async function verifyMasterPassword(password) {
  if (!password) {
    throw new Error('Password is required');
  }

  // Check if account is locked
  const lockStatus = checkLockoutStatus();
  if (lockStatus.locked) {
    return {
      success: false,
      locked: true,
      message: `Account locked. Try again in ${lockStatus.remainingSeconds} seconds.`,
      remainingSeconds: lockStatus.remainingSeconds
    };
  }

  try {
    // Load auth data
    const authData = await loadAuthData();
    if (!authData || !authData.initialized) {
      throw new Error('Authentication not configured');
    }

    // Retrieve stored hash and salt from keychain
    const storedHash = await retrieveKey(PASSWORD_HASH_ACCOUNT);
    const storedSalt = await retrieveKey(PASSWORD_SALT_ACCOUNT);

    if (!storedHash || !storedSalt) {
      throw new Error('Authentication credentials not found');
    }

    // Verify password
    const isValid = await verifyPassword(password, storedHash, storedSalt);

    if (!isValid) {
      recordFailedAttempt();
      return {
        success: false,
        message: 'Authentication failed',
        attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts)
      };
    }

    // Reset failed attempts on successful authentication
    resetFailedAttempts();

    // Retrieve encryption key
    const encryptionKey = await retrieveKey('encryption-key');

    return {
      success: true,
      encryptionKey: encryptionKey
    };
  } catch (error) {
    console.error('Password verification failed:', error);
    throw new Error(`Password verification failed: ${error.message}`);
  }
}

/**
 * Change the master password
 * @param {string} oldPassword - The current password
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} Change result
 */
async function changePassword(oldPassword, newPassword) {
  if (!oldPassword || !newPassword) {
    throw new Error('Both old and new passwords are required');
  }

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long');
  }

  try {
    // Verify old password first
    const verification = await verifyMasterPassword(oldPassword);
    if (!verification.success) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const { hash, salt, iterations } = await hashPassword(newPassword);

    // Update stored credentials
    await storeKey(hash, PASSWORD_HASH_ACCOUNT);
    await storeKey(salt, PASSWORD_SALT_ACCOUNT);

    // Update metadata
    const authData = await loadAuthData();
    authData.lastPasswordChange = new Date().toISOString();
    authData.iterations = iterations;
    await storeAuthData(authData);

    console.log('Password changed successfully');

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    console.error('Failed to change password:', error);
    throw new Error(`Password change failed: ${error.message}`);
  }
}

/**
 * Check if password is set up
 * @returns {Promise<boolean>} True if password is set up
 */
async function isPasswordSetup() {
  try {
    const authData = await loadAuthData();
    return authData && authData.initialized === true;
  } catch (error) {
    console.error('Failed to check password setup:', error);
    return false;
  }
}

/**
 * Reset all authentication data (use with caution!)
 * @returns {Promise<boolean>} True if successful
 */
async function resetAuthentication() {
  try {
    // Delete from keychain
    await deleteKey(PASSWORD_HASH_ACCOUNT);
    await deleteKey(PASSWORD_SALT_ACCOUNT);
    await deleteKey('encryption-key');

    // Delete auth file
    try {
      await fs.unlink(AUTH_FILE);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Reset rate limiting
    resetFailedAttempts();

    console.log('Authentication reset successfully');
    return true;
  } catch (error) {
    console.error('Failed to reset authentication:', error);
    throw new Error(`Authentication reset failed: ${error.message}`);
  }
}

module.exports = {
  setupPassword,
  verifyMasterPassword,
  changePassword,
  isPasswordSetup,
  resetAuthentication,
  checkLockoutStatus,
  resetFailedAttempts,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS
};
