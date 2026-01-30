/**
 * Database initialization module
 * Handles SQLite database connection using better-sqlite3
 * Supports optional encryption for database files
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;
let isInitialized = false;

// Default database path
const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'notes.db');

/**
 * Initialize the database
 * @param {Object} options - Configuration options
 * @param {string} options.dbPath - Path to the database file (default: data/notes.db)
 * @param {boolean} options.readonly - Open database in readonly mode (default: false)
 * @param {boolean} options.verbose - Enable verbose logging (default: false)
 * @param {boolean} options.fileMustExist - Throw error if database doesn't exist (default: false)
 * @returns {Database} The database instance
 */
function initializeDatabase(options = {}) {
  if (isInitialized && db) {
    console.log('Database already initialized');
    return db;
  }

  try {
    const dbPath = options.dbPath || DEFAULT_DB_PATH;
    const readonly = options.readonly || false;
    const verbose = options.verbose || false;
    const fileMustExist = options.fileMustExist || false;

    // Ensure data directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`Initializing database at: ${dbPath}`);

    // Create database connection
    db = new Database(dbPath, {
      readonly: readonly,
      fileMustExist: fileMustExist,
      verbose: verbose ? console.log : null
    });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Set journal mode to WAL for better concurrency
    db.pragma('journal_mode = WAL');

    // Create tables if they don't exist
    createTables();

    isInitialized = true;
    console.log('Database initialized successfully');

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error(`Database initialization failed: ${error.message}`);
  }
}

/**
 * Create database tables
 */
function createTables() {
  if (!db) {
    throw new Error('Database not initialized');
  }

  // Notes table with encryption fields
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      iv TEXT NOT NULL,
      authTag TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      tags TEXT,
      isFavorite INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0
    )
  `);

  // Settings table for app configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Tags table for organizing notes
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_notes_createdAt ON notes(createdAt);
    CREATE INDEX IF NOT EXISTS idx_notes_updatedAt ON notes(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_notes_isFavorite ON notes(isFavorite);
    CREATE INDEX IF NOT EXISTS idx_notes_isArchived ON notes(isArchived);
  `);

  console.log('Database tables created successfully');
}

/**
 * Get the database instance
 * @returns {Database} The database instance
 */
function getDatabase() {
  if (!isInitialized || !db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
function closeDatabase() {
  if (db) {
    try {
      db.close();
      db = null;
      isInitialized = false;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
      throw error;
    }
  }
}

/**
 * Check if database is initialized
 * @returns {boolean}
 */
function isDatabaseInitialized() {
  return isInitialized;
}

/**
 * Execute a raw SQL query (use with caution)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {*} Query result
 */
function executeQuery(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

/**
 * Begin a database transaction
 * @returns {Transaction} Transaction object
 */
function beginTransaction() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.transaction;
}

/**
 * Backup the database to a file
 * @param {string} backupPath - Path for the backup file
 * @returns {Promise<void>}
 */
async function backupDatabase(backupPath) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    try {
      const backupDb = new Database(backupPath);
      db.backup(backupDb)
        .then(() => {
          backupDb.close();
          console.log(`Database backed up to: ${backupPath}`);
          resolve();
        })
        .catch(error => {
          backupDb.close();
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get database statistics
 * @returns {Object} Database statistics
 */
function getDatabaseStats() {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const noteCount = db.prepare('SELECT COUNT(*) as count FROM notes').get();
  const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get();
  
  return {
    totalNotes: noteCount.count,
    totalTags: tagCount.count,
    dbPath: db.name,
    isOpen: db.open,
    readonly: db.readonly
  };
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  isDatabaseInitialized,
  executeQuery,
  beginTransaction,
  backupDatabase,
  getDatabaseStats,
  DEFAULT_DB_PATH
};
