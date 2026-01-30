# Smart Scribe Backend

Core backend implementation for the Smart Scribe Electron+React AI Notepad application.

## Overview

This backend provides secure note storage with encryption, AI-powered text processing, and user authentication. All note content is encrypted at rest using AES-256-GCM encryption.

## Directory Structure

```
backend/
├── ai/                      # AI model and inference
│   ├── modelLoader.js       # LLM model initialization and management
│   ├── inference.js         # Text processing with different styles
│   └── prompts.js           # Prompt templates for writing styles
├── database/                # Data persistence
│   ├── db.js                # SQLite database initialization
│   ├── encryption.js        # AES-256 encryption for note content
│   └── models/
│       └── Note.js          # CRUD operations for notes
└── security/                # Authentication and cryptography
    ├── auth.js              # Password setup and verification
    ├── crypto.js            # Low-level cryptographic utilities
    └── keychain.js          # Secure key storage with keytar
```

## Modules

### AI Modules

#### `ai/prompts.js`
Provides prompt templates for different writing styles:
- `refine` - Improve and polish text
- `formal` - Convert to formal/professional style
- `casual` - Convert to casual/conversational style
- `grammar` - Fix grammar and spelling errors
- `concise` - Make text more concise
- `simplify` - Simplify complex text

```javascript
const { getPrompt, getAvailableStyles } = require('./backend/ai/prompts');

// Get a prompt for a specific style
const prompt = getPrompt('formal', 'Hey, what\'s up?');

// Get all available styles
const styles = getAvailableStyles();
```

#### `ai/modelLoader.js`
Handles loading and managing the LFM2-350M-Q6_K.gguf model using node-llama-cpp:

```javascript
const { initializeModel, runInference, isModelInitialized } = require('./backend/ai/modelLoader');

// Initialize the model
await initializeModel({
  modelPath: './models/LFM2-350M-Q6_K.gguf',
  contextSize: 2048,
  gpuLayers: 0
});

// Run inference
const result = await runInference(prompt, {
  temperature: 0.7,
  maxTokens: 500
});
```

#### `ai/inference.js`
High-level interface for text processing:

```javascript
const { processText, getSuggestions } = require('./backend/ai/inference');

// Process text with a specific style
const improved = await processText('some text', 'refine');

// Get multiple style suggestions
const suggestions = await getSuggestions('some text');
```

### Database Modules

#### `database/db.js`
SQLite database initialization with better-sqlite3:

```javascript
const { initializeDatabase, getDatabase, getDatabaseStats } = require('./backend/database/db');

// Initialize database
const db = initializeDatabase({
  dbPath: './data/notes.db',
  verbose: false
});

// Get statistics
const stats = getDatabaseStats();
```

#### `database/encryption.js`
AES-256-GCM encryption for note content:

```javascript
const { encryptContent, decryptContent } = require('./backend/database/encryption');

// Encrypt content
const encrypted = encryptContent('My secret note', encryptionKey);
// Returns: { content, iv, authTag, encryptedAt }

// Decrypt content
const decrypted = decryptContent(
  encrypted.content,
  encryptionKey,
  encrypted.iv,
  encrypted.authTag
);
```

#### `database/models/Note.js`
CRUD operations for encrypted notes:

```javascript
const Note = require('./backend/database/models/Note');

// Create a note (automatically encrypted)
const note = Note.createNote({
  title: 'My Note',
  content: 'Note content',
  tags: ['personal', 'ideas'],
  isFavorite: false
}, encryptionKey);

// Get a note (automatically decrypted)
const retrievedNote = Note.getNoteById(note.id, encryptionKey);

// Get all notes
const allNotes = Note.getAllNotes({
  includeArchived: false,
  favoritesOnly: false,
  orderBy: 'updatedAt',
  order: 'DESC'
}, encryptionKey);

// Update a note
const updated = Note.updateNote(note.id, {
  title: 'Updated Title',
  content: 'Updated content',
  isFavorite: true
}, encryptionKey);

// Delete a note
Note.deleteNote(note.id);

// Search notes
const results = Note.searchNotes('search query', encryptionKey);
```

### Security Modules

#### `security/crypto.js`
Low-level cryptographic utilities:

```javascript
const crypto = require('./backend/security/crypto');

// Hash a password
const { hash, salt } = await crypto.hashPassword('myPassword');

// Verify a password
const isValid = await crypto.verifyPassword('myPassword', hash, salt);

// Generate encryption keys
const key = crypto.generateKey(); // 32 bytes
const iv = crypto.generateIV();   // 16 bytes
const salt = crypto.generateSalt(); // 32 bytes

// Encrypt/decrypt data
const encrypted = crypto.encrypt('data', key);
const decrypted = crypto.decrypt(encrypted.encrypted, key, encrypted.iv, encrypted.authTag);
```

#### `security/keychain.js`
Secure credential storage using keytar:

```javascript
const keychain = require('./backend/security/keychain');

// Store encryption key
await keychain.storeKey(encryptionKey);

// Retrieve encryption key
const key = await keychain.retrieveKey();

// Delete encryption key
await keychain.deleteKey();

// Check if key exists
const exists = await keychain.hasKey();
```

**Note**: If keytar is not available, the module falls back to in-memory storage (not secure, for development only).

#### `security/auth.js`
Master password management:

```javascript
const auth = require('./backend/security/auth');

// Setup master password (first time)
const setup = await auth.setupPassword('mySecurePassword');
// Returns: { success: true, encryptionKey: '...' }

// Verify master password
const verification = await auth.verifyMasterPassword('mySecurePassword');
// Returns: { success: true, encryptionKey: '...' }

// Change password
await auth.changePassword('oldPassword', 'newPassword');

// Check if password is setup
const isSetup = await auth.isPasswordSetup();

// Reset authentication (use with caution!)
await auth.resetAuthentication();
```

## Security Features

1. **Encryption at Rest**: All note content is encrypted using AES-256-GCM before storage
2. **Master Password**: PBKDF2-based password hashing with 100,000 iterations
3. **Secure Key Storage**: Encryption keys stored in system keychain via keytar
4. **Authentication Tags**: GCM mode provides authenticated encryption
5. **Random IVs**: Unique initialization vector for each encrypted record

## Dependencies

The backend requires the following npm packages:

```json
{
  "dependencies": {
    "better-sqlite3": "^9.0.0",
    "crypto-js": "^4.2.0",
    "keytar": "^7.9.0",
    "node-llama-cpp": "^2.0.0"
  }
}
```

## Usage Example

Complete example of initializing and using the backend:

```javascript
const { initializeDatabase } = require('./backend/database/db');
const { setupPassword, verifyMasterPassword } = require('./backend/security/auth');
const { initializeModel } = require('./backend/ai/modelLoader');
const { processText } = require('./backend/ai/inference');
const Note = require('./backend/database/models/Note');

async function initialize() {
  // 1. Initialize database
  initializeDatabase();

  // 2. Setup master password (first time only)
  const { encryptionKey } = await setupPassword('myMasterPassword');

  // 3. Initialize AI model
  await initializeModel({
    modelPath: './models/LFM2-350M-Q6_K.gguf'
  });

  // 4. Create a note
  const note = Note.createNote({
    title: 'My First Note',
    content: 'This is my secret note content',
    tags: ['personal']
  }, encryptionKey);

  // 5. Process text with AI
  const refined = await processText(note.content, 'refine');

  // 6. Update note with AI-processed content
  Note.updateNote(note.id, {
    content: refined
  }, encryptionKey);

  console.log('Backend initialized successfully!');
}

// On subsequent app launches
async function login(password) {
  // Verify password and get encryption key
  const result = await verifyMasterPassword(password);
  
  if (result.success) {
    // Initialize database and model
    initializeDatabase();
    await initializeModel();
    
    return result.encryptionKey;
  } else {
    throw new Error('Invalid password');
  }
}
```

## Development Notes

### Testing Without keytar

If keytar is not available (e.g., in Docker or CI/CD), the keychain module will automatically fall back to in-memory storage. This is acceptable for development but **NOT for production**.

### Database Location

By default, the database is stored at `./data/notes.db`. You can customize this by passing `dbPath` to `initializeDatabase()`.

### Model Location

The AI model should be placed at `./models/LFM2-350M-Q6_K.gguf` or specify a custom path when calling `initializeModel()`.

## Security Best Practices

1. **Never commit encryption keys**: Keep keys in keychain only
2. **Use strong master passwords**: Enforce minimum password requirements
3. **Backup encrypted data**: Regular database backups
4. **Secure the model**: Ensure model file integrity
5. **Update dependencies**: Keep crypto libraries up to date

## License

This backend is part of the Smart Scribe application.
