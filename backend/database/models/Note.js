/**
 * Note model with CRUD operations
 * All content is encrypted at rest using AES-256-GCM
 */

const { getDatabase } = require('../db');
const { encryptContent, decryptContent } = require('../encryption');

/**
 * Create a new note
 * @param {Object} noteData - Note data
 * @param {string} noteData.title - Note title
 * @param {string} noteData.content - Note content
 * @param {string[]} noteData.tags - Optional tags
 * @param {boolean} noteData.isFavorite - Optional favorite flag
 * @param {string} encryptionKey - Encryption key
 * @returns {Object} Created note with ID
 */
function createNote(noteData, encryptionKey) {
  if (!noteData || !noteData.title || !noteData.content) {
    throw new Error('Title and content are required');
  }

  if (!encryptionKey) {
    throw new Error('Encryption key is required');
  }

  const db = getDatabase();

  try {
    // Encrypt title and content
    const encryptedTitle = encryptContent(noteData.title, encryptionKey);
    const encryptedContent = encryptContent(noteData.content, encryptionKey);

    const now = new Date().toISOString();
    const tags = noteData.tags ? JSON.stringify(noteData.tags) : null;

    // Insert note into database
    const stmt = db.prepare(`
      INSERT INTO notes (title, content, iv, authTag, createdAt, updatedAt, tags, isFavorite, isArchived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Store title's encrypted data along with content's encrypted data
    // For simplicity, we'll use content's IV and authTag for the entire record
    // In production, you might want separate fields for title encryption
    const titleEncrypted = encryptContent(noteData.title + '|||' + noteData.content, encryptionKey);

    const result = stmt.run(
      titleEncrypted.content.substring(0, Math.min(titleEncrypted.content.length / 2, 1000)), // Store partial encrypted data as title
      titleEncrypted.content,
      titleEncrypted.iv,
      titleEncrypted.authTag,
      now,
      now,
      tags,
      noteData.isFavorite ? 1 : 0,
      0
    );

    console.log(`Note created with ID: ${result.lastInsertRowid}`);

    return {
      id: result.lastInsertRowid,
      title: noteData.title,
      content: noteData.content,
      tags: noteData.tags,
      isFavorite: noteData.isFavorite || false,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    console.error('Failed to create note:', error);
    throw new Error(`Failed to create note: ${error.message}`);
  }
}

/**
 * Get a note by ID
 * @param {number} noteId - Note ID
 * @param {string} encryptionKey - Encryption key
 * @returns {Object|null} Decrypted note or null if not found
 */
function getNoteById(noteId, encryptionKey) {
  if (!noteId) {
    throw new Error('Note ID is required');
  }

  if (!encryptionKey) {
    throw new Error('Encryption key is required');
  }

  const db = getDatabase();

  try {
    const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
    const row = stmt.get(noteId);

    if (!row) {
      return null;
    }

    return decryptNote(row, encryptionKey);
  } catch (error) {
    console.error('Failed to get note:', error);
    throw new Error(`Failed to get note: ${error.message}`);
  }
}

/**
 * Get all notes
 * @param {Object} options - Query options
 * @param {boolean} options.includeArchived - Include archived notes (default: false)
 * @param {boolean} options.favoritesOnly - Get only favorites (default: false)
 * @param {string} options.orderBy - Order by field (default: 'updatedAt')
 * @param {string} options.order - Order direction 'ASC' or 'DESC' (default: 'DESC')
 * @param {string} encryptionKey - Encryption key
 * @returns {Object[]} Array of decrypted notes
 */
function getAllNotes(options = {}, encryptionKey) {
  if (!encryptionKey) {
    throw new Error('Encryption key is required');
  }

  const db = getDatabase();

  try {
    const includeArchived = options.includeArchived || false;
    const favoritesOnly = options.favoritesOnly || false;
    const orderBy = options.orderBy || 'updatedAt';
    const order = options.order || 'DESC';

    let sql = 'SELECT * FROM notes WHERE 1=1';
    const params = [];

    if (!includeArchived) {
      sql += ' AND isArchived = 0';
    }

    if (favoritesOnly) {
      sql += ' AND isFavorite = 1';
    }

    sql += ` ORDER BY ${orderBy} ${order}`;

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);

    // Decrypt all notes
    return rows.map(row => {
      try {
        return decryptNote(row, encryptionKey);
      } catch (error) {
        console.error(`Failed to decrypt note ${row.id}:`, error);
        return null;
      }
    }).filter(note => note !== null);
  } catch (error) {
    console.error('Failed to get notes:', error);
    throw new Error(`Failed to get notes: ${error.message}`);
  }
}

/**
 * Update a note
 * @param {number} noteId - Note ID
 * @param {Object} updates - Fields to update
 * @param {string} updates.title - New title
 * @param {string} updates.content - New content
 * @param {string[]} updates.tags - New tags
 * @param {boolean} updates.isFavorite - Favorite flag
 * @param {boolean} updates.isArchived - Archived flag
 * @param {string} encryptionKey - Encryption key
 * @returns {Object} Updated note
 */
function updateNote(noteId, updates, encryptionKey) {
  if (!noteId) {
    throw new Error('Note ID is required');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required');
  }

  if (!encryptionKey) {
    throw new Error('Encryption key is required');
  }

  const db = getDatabase();

  try {
    // Get existing note
    const existingNote = getNoteById(noteId, encryptionKey);
    if (!existingNote) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    // Handle title and content updates (need re-encryption)
    if (updates.title !== undefined || updates.content !== undefined) {
      const newTitle = updates.title !== undefined ? updates.title : existingNote.title;
      const newContent = updates.content !== undefined ? updates.content : existingNote.content;

      const combined = newTitle + '|||' + newContent;
      const encrypted = encryptContent(combined, encryptionKey);

      fields.push('title = ?');
      values.push(encrypted.content.substring(0, Math.min(encrypted.content.length / 2, 1000)));
      
      fields.push('content = ?');
      values.push(encrypted.content);
      
      fields.push('iv = ?');
      values.push(encrypted.iv);
      
      fields.push('authTag = ?');
      values.push(encrypted.authTag);
    }

    // Handle other fields
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }

    if (updates.isFavorite !== undefined) {
      fields.push('isFavorite = ?');
      values.push(updates.isFavorite ? 1 : 0);
    }

    if (updates.isArchived !== undefined) {
      fields.push('isArchived = ?');
      values.push(updates.isArchived ? 1 : 0);
    }

    // Always update updatedAt
    fields.push('updatedAt = ?');
    values.push(now);

    if (fields.length === 1) { // Only updatedAt
      throw new Error('No fields to update');
    }

    const sql = `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`;
    values.push(noteId);

    const stmt = db.prepare(sql);
    stmt.run(...values);

    console.log(`Note ${noteId} updated successfully`);

    // Return updated note
    return getNoteById(noteId, encryptionKey);
  } catch (error) {
    console.error('Failed to update note:', error);
    throw new Error(`Failed to update note: ${error.message}`);
  }
}

/**
 * Delete a note
 * @param {number} noteId - Note ID
 * @returns {boolean} True if deleted
 */
function deleteNote(noteId) {
  if (!noteId) {
    throw new Error('Note ID is required');
  }

  const db = getDatabase();

  try {
    const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
    const result = stmt.run(noteId);

    if (result.changes === 0) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    console.log(`Note ${noteId} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Failed to delete note:', error);
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}

/**
 * Search notes by content or title
 * @param {string} query - Search query
 * @param {string} encryptionKey - Encryption key
 * @returns {Object[]} Array of matching notes
 */
function searchNotes(query, encryptionKey) {
  if (!query) {
    throw new Error('Search query is required');
  }

  if (!encryptionKey) {
    throw new Error('Encryption key is required');
  }

  // Since content is encrypted, we need to decrypt all notes and search in memory
  // This is not efficient for large databases, but works for MVP
  const allNotes = getAllNotes({}, encryptionKey);

  const searchLower = query.toLowerCase();
  return allNotes.filter(note => {
    return note.title.toLowerCase().includes(searchLower) ||
           note.content.toLowerCase().includes(searchLower);
  });
}

/**
 * Helper function to decrypt a note row
 * @param {Object} row - Database row
 * @param {string} encryptionKey - Encryption key
 * @returns {Object} Decrypted note
 */
function decryptNote(row, encryptionKey) {
  try {
    // Decrypt the combined title|||content
    const decrypted = decryptContent(row.content, encryptionKey, row.iv, row.authTag);
    const [title, content] = decrypted.split('|||');

    return {
      id: row.id,
      title: title || '',
      content: content || '',
      tags: row.tags ? JSON.parse(row.tags) : [],
      isFavorite: row.isFavorite === 1,
      isArchived: row.isArchived === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  } catch (error) {
    console.error('Failed to decrypt note:', error);
    throw new Error(`Failed to decrypt note: ${error.message}`);
  }
}

/**
 * Get notes count
 * @param {Object} options - Count options
 * @param {boolean} options.includeArchived - Include archived notes
 * @returns {number} Number of notes
 */
function getNotesCount(options = {}) {
  const db = getDatabase();

  try {
    let sql = 'SELECT COUNT(*) as count FROM notes WHERE 1=1';
    
    if (!options.includeArchived) {
      sql += ' AND isArchived = 0';
    }

    const stmt = db.prepare(sql);
    const result = stmt.get();
    
    return result.count;
  } catch (error) {
    console.error('Failed to get notes count:', error);
    throw new Error(`Failed to get notes count: ${error.message}`);
  }
}

module.exports = {
  createNote,
  getNoteById,
  getAllNotes,
  updateNote,
  deleteNote,
  searchNotes,
  getNotesCount
};
