/**
 * Smart Scribe Backend - Main Entry Point
 * Exports all backend modules for easy importing
 */

// AI Modules
const prompts = require('./ai/prompts');
const modelLoader = require('./ai/modelLoader');
const inference = require('./ai/inference');

// Database Modules
const db = require('./database/db');
const encryption = require('./database/encryption');
const Note = require('./database/models/Note');

// Security Modules
const auth = require('./security/auth');
const crypto = require('./security/crypto');
const keychain = require('./security/keychain');

module.exports = {
  // AI
  ai: {
    prompts,
    modelLoader,
    inference
  },
  
  // Database
  database: {
    db,
    encryption,
    models: {
      Note
    }
  },
  
  // Security
  security: {
    auth,
    crypto,
    keychain
  }
};
