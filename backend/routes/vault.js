import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  generateNonce,
  encryptBinaryData,
  decryptBinaryData
} from '../services/encryption.js';

const router = express.Router();

// Get all vault items for user
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const items = db.prepare(`
      SELECT id, file_name, file_type, file_size_bytes, recipients, tags, created_at
      FROM vaults 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId);

    res.json(items);
  } catch (error) {
    console.error('Get vault error:', error);
    res.status(500).json({ error: 'Failed to fetch vault items' });
  }
});

// Upload file to vault
router.post('/upload', (req, res) => {
  try {
    const { fileName, fileType, encryptedContent, authTag, nonce, recipients, tags } = req.body;
    const db = req.app.locals.db;

    if (!fileName || !encryptedContent) {
      return res.status(400).json({ error: 'File name and content required' });
    }

    const vaultId = uuidv4();
    const fileSize = Buffer.from(encryptedContent, 'hex').length;

    // Check storage limit
    const user = db.prepare('SELECT storage_limit_gb, storage_used_mb FROM users WHERE id = ?')
      .get(req.userId);
    const totalUsedMb = user.storage_used_mb + (fileSize / 1024 / 1024);

    if (totalUsedMb > (user.storage_limit_gb * 1024)) {
      return res.status(413).json({ error: 'Storage limit exceeded' });
    }

    // Store encrypted file
    db.prepare(`
      INSERT INTO vaults (
        id, user_id, encrypted_content, encryption_nonce, 
        file_name, file_type, file_size_bytes, recipients, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vaultId,
      req.userId,
      Buffer.from(encryptedContent, 'hex'),
      nonce,
      fileName,
      fileType,
      fileSize,
      JSON.stringify(recipients || []),
      JSON.stringify(tags || [])
    );

    // Update user storage
    db.prepare('UPDATE users SET storage_used_mb = ? WHERE id = ?')
      .run(totalUsedMb, req.userId);

    res.status(201).json({
      message: 'File uploaded successfully',
      vaultId,
      fileName,
      fileSize
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get vault item
router.get('/:vaultId', (req, res) => {
  try {
    const db = req.app.locals.db;
    const item = db.prepare(`
      SELECT id, file_name, file_type, file_size_bytes, 
             encrypted_content, encryption_nonce, recipients, tags
      FROM vaults 
      WHERE id = ? AND user_id = ?
    `).get(req.params.vaultId, req.userId);

    if (!item) {
      return res.status(404).json({ error: 'Vault item not found' });
    }

    res.json({
      ...item,
      encrypted_content: item.encrypted_content.toString('hex'),
      recipients: JSON.parse(item.recipients || '[]'),
      tags: JSON.parse(item.tags || '[]')
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch vault item' });
  }
});

// Update vault item
router.put('/:vaultId', (req, res) => {
  try {
    const { fileName, tags, recipients } = req.body;
    const db = req.app.locals.db;

    const item = db.prepare('SELECT id FROM vaults WHERE id = ? AND user_id = ?')
      .get(req.params.vaultId, req.userId);

    if (!item) {
      return res.status(404).json({ error: 'Vault item not found' });
    }

    db.prepare(`
      UPDATE vaults 
      SET file_name = ?, tags = ?, recipients = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      fileName || undefined,
      JSON.stringify(tags || []),
      JSON.stringify(recipients || []),
      req.params.vaultId
    );

    res.json({ message: 'Vault item updated' });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update vault item' });
  }
});

// Delete vault item
router.delete('/:vaultId', (req, res) => {
  try {
    const db = req.app.locals.db;

    const item = db.prepare('SELECT file_size_bytes FROM vaults WHERE id = ? AND user_id = ?')
      .get(req.params.vaultId, req.userId);

    if (!item) {
      return res.status(404).json({ error: 'Vault item not found' });
    }

    db.prepare('DELETE FROM vaults WHERE id = ?').run(req.params.vaultId);

    // Update storage
    const user = db.prepare('SELECT storage_used_mb FROM users WHERE id = ?')
      .get(req.userId);
    const newUsage = Math.max(0, user.storage_used_mb - (item.file_size_bytes / 1024 / 1024));
    db.prepare('UPDATE users SET storage_used_mb = ? WHERE id = ?')
      .run(newUsage, req.userId);

    res.json({ message: 'Vault item deleted' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete vault item' });
  }
});

// Search vault
router.get('/search/:query', (req, res) => {
  try {
    const db = req.app.locals.db;
    const results = db.prepare(`
      SELECT id, file_name, file_type, file_size_bytes, created_at
      FROM vaults 
      WHERE user_id = ? AND (file_name LIKE ? OR tags LIKE ?)
      ORDER BY created_at DESC
    `).all(req.userId, `%${req.params.query}%`, `%${req.params.query}%`);

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get vault statistics
router.get('/stats', (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const stats = {
      totalItems: db.prepare('SELECT COUNT(*) as count FROM vaults WHERE user_id = ?')
        .get(req.userId).count,
      totalSize: db.prepare('SELECT SUM(file_size_bytes) as total FROM vaults WHERE user_id = ?')
        .get(req.userId).total || 0,
      itemsByType: db.prepare(`
        SELECT file_type, COUNT(*) as count FROM vaults 
        WHERE user_id = ? GROUP BY file_type
      `).all(req.userId)
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;