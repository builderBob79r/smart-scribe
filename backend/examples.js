/**
 * Example usage of Smart Scribe Backend
 * This demonstrates how to use the various modules
 */

const backend = require('./index');

// Destructure for easier access
const { ai, database, security } = backend;

/**
 * Example 1: Initialize the system and create a note
 */
async function example1_InitializeAndCreateNote() {
  console.log('\n=== Example 1: Initialize and Create Note ===\n');

  try {
    // Step 1: Initialize database
    console.log('1. Initializing database...');
    database.db.initializeDatabase({
      dbPath: './data/notes.db'
    });

    // Step 2: Setup master password (first time only)
    console.log('2. Setting up master password...');
    const { encryptionKey } = await security.auth.setupPassword('MySecurePassword123');
    console.log('   Master password setup complete');

    // Step 3: Create a note (automatically encrypted)
    console.log('3. Creating encrypted note...');
    const note = database.models.Note.createNote({
      title: 'My First Note',
      content: 'This is a test note with secret content!',
      tags: ['personal', 'test'],
      isFavorite: true
    }, encryptionKey);
    console.log('   Note created with ID:', note.id);

    // Step 4: Retrieve the note (automatically decrypted)
    console.log('4. Retrieving note...');
    const retrievedNote = database.models.Note.getNoteById(note.id, encryptionKey);
    console.log('   Title:', retrievedNote.title);
    console.log('   Content:', retrievedNote.content);
    console.log('   Tags:', retrievedNote.tags);

  } catch (error) {
    console.error('Error in example 1:', error.message);
  } finally {
    // Cleanup for next example
    await security.auth.resetAuthentication();
    database.db.closeDatabase();
  }
}

/**
 * Example 2: AI text processing
 */
async function example2_AIProcessing() {
  console.log('\n=== Example 2: AI Text Processing ===\n');

  try {
    // Note: This requires the AI model to be present
    console.log('1. Getting available writing styles...');
    const styles = ai.prompts.getAvailableStyles();
    console.log('   Available styles:', styles.join(', '));

    // Get a prompt for formal style
    console.log('\n2. Generating prompt for formal style...');
    const originalText = 'Hey, what\'s up? Can you help me out?';
    const prompt = ai.prompts.getPrompt('formal', originalText);
    console.log('   Original text:', originalText);
    console.log('   Generated prompt preview:', prompt.substring(0, 100) + '...');

    console.log('\n   Note: To actually run inference, initialize the model with:');
    console.log('   await ai.modelLoader.initializeModel({ modelPath: "./models/LFM2-350M-Q6_K.gguf" })');

  } catch (error) {
    console.error('Error in example 2:', error.message);
  }
}

/**
 * Example 3: Encryption and decryption
 */
async function example3_Encryption() {
  console.log('\n=== Example 3: Encryption and Decryption ===\n');

  try {
    // Generate encryption key
    console.log('1. Generating encryption key...');
    const encryptionKey = security.crypto.generateKey();
    console.log('   Key generated (length:', encryptionKey.length, 'bytes)');

    // Encrypt some content
    console.log('\n2. Encrypting content...');
    const originalContent = 'This is my secret message!';
    const encrypted = database.encryption.encryptContent(originalContent, encryptionKey.toString('hex'));
    console.log('   Original:', originalContent);
    console.log('   Encrypted:', encrypted.content.substring(0, 50) + '...');
    console.log('   IV:', encrypted.iv);
    console.log('   Auth Tag:', encrypted.authTag);

    // Decrypt the content
    console.log('\n3. Decrypting content...');
    const decrypted = database.encryption.decryptContent(
      encrypted.content,
      encryptionKey.toString('hex'),
      encrypted.iv,
      encrypted.authTag
    );
    console.log('   Decrypted:', decrypted);
    console.log('   Match:', originalContent === decrypted ? '✓' : '✗');

  } catch (error) {
    console.error('Error in example 3:', error.message);
  }
}

/**
 * Example 4: Password hashing and verification
 */
async function example4_PasswordHashing() {
  console.log('\n=== Example 4: Password Hashing ===\n');

  try {
    const password = 'MySecurePassword123';

    // Hash password
    console.log('1. Hashing password...');
    const { hash, salt, iterations } = await security.crypto.hashPassword(password);
    console.log('   Password:', password);
    console.log('   Hash:', hash.substring(0, 40) + '...');
    console.log('   Salt:', salt.substring(0, 40) + '...');
    console.log('   Iterations:', iterations);

    // Verify correct password
    console.log('\n2. Verifying correct password...');
    const isValid = await security.crypto.verifyPassword(password, hash, salt);
    console.log('   Result:', isValid ? '✓ Valid' : '✗ Invalid');

    // Verify incorrect password
    console.log('\n3. Verifying incorrect password...');
    const isInvalid = await security.crypto.verifyPassword('WrongPassword', hash, salt);
    console.log('   Result:', isInvalid ? '✓ Valid' : '✗ Invalid (expected)');

  } catch (error) {
    console.error('Error in example 4:', error.message);
  }
}

/**
 * Example 5: Complete workflow
 */
async function example5_CompleteWorkflow() {
  console.log('\n=== Example 5: Complete Workflow ===\n');

  try {
    // Initialize
    console.log('1. Initializing system...');
    database.db.initializeDatabase();
    const { encryptionKey } = await security.auth.setupPassword('TestPassword123');

    // Create multiple notes
    console.log('\n2. Creating multiple notes...');
    const note1 = database.models.Note.createNote({
      title: 'Meeting Notes',
      content: 'Discussed project timeline and deliverables',
      tags: ['work', 'meetings']
    }, encryptionKey);

    const note2 = database.models.Note.createNote({
      title: 'Personal Thoughts',
      content: 'Today was a great day!',
      tags: ['personal', 'diary'],
      isFavorite: true
    }, encryptionKey);

    console.log('   Created notes:', note1.id, note2.id);

    // Get all notes
    console.log('\n3. Retrieving all notes...');
    const allNotes = database.models.Note.getAllNotes({}, encryptionKey);
    console.log('   Total notes:', allNotes.length);
    allNotes.forEach(note => {
      console.log('   -', note.title, note.isFavorite ? '⭐' : '');
    });

    // Search notes
    console.log('\n4. Searching for "great"...');
    const searchResults = database.models.Note.searchNotes('great', encryptionKey);
    console.log('   Found:', searchResults.length, 'note(s)');
    searchResults.forEach(note => {
      console.log('   -', note.title);
    });

    // Update a note
    console.log('\n5. Updating note...');
    database.models.Note.updateNote(note1.id, {
      content: 'Updated: Discussed project timeline, deliverables, and next steps'
    }, encryptionKey);
    console.log('   Note updated');

    // Get database stats
    console.log('\n6. Database statistics...');
    const stats = database.db.getDatabaseStats();
    console.log('   Total notes:', stats.totalNotes);
    console.log('   Database path:', stats.dbPath);

  } catch (error) {
    console.error('Error in example 5:', error.message);
  } finally {
    // Cleanup
    await security.auth.resetAuthentication();
    database.db.closeDatabase();
  }
}

// Main function to run examples
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Smart Scribe Backend - Usage Examples  ║');
  console.log('╚══════════════════════════════════════════╝');

  // Run examples
  await example1_InitializeAndCreateNote();
  await example2_AIProcessing();
  await example3_Encryption();
  await example4_PasswordHashing();
  await example5_CompleteWorkflow();

  console.log('\n✓ All examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  example1_InitializeAndCreateNote,
  example2_AIProcessing,
  example3_Encryption,
  example4_PasswordHashing,
  example5_CompleteWorkflow
};
