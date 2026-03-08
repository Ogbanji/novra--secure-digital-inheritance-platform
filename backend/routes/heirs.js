import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateKeyPair } from '../services/encryption.js';

const router = express.Router();

// Get all heirs
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const heirs = db.prepare(`
      SELECT id, name, email, relationship, inheritance_share, permissions, status, confirmed_at
      FROM heirs 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId);

    res.json(heirs.map(heir => ({
      ...heir,
      permissions: JSON.parse(heir.permissions || '[]')
    })));
  } catch (error) {
    console.error('Get heirs error:', error);
    res.status(500).json({ error: 'Failed to fetch heirs' });
  }
});

// Add heir
router.post('/', (req, res) => {
  try {
    const { email, name, relationship, inheritanceShare, permissions } = req.body;
    const db = req.app.locals.db;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Check if heir already exists
    const existingHeir = db.prepare('SELECT id FROM heirs WHERE user_id = ? AND email = ?')
      .get(req.userId, email);

    if (existingHeir) {
      return res.status(409).json({ error: 'Heir already added' });
    }

    const heirId = uuidv4();
    const { publicKey, privateKey } = generateKeyPair();

    db.prepare(`
      INSERT INTO heirs (
        id, user_id, email, name, relationship, 
        inheritance_share, permissions, heir_public_key, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      heirId,
      req.userId,
      email,
      name || '',
      relationship || '',
      inheritanceShare || 100,
      JSON.stringify(permissions || ['read']),
      publicKey
    );

    res.status(201).json({
      message: 'Heir added successfully',
      heirId,
      email,
      status: 'pending'
    });
  } catch (error) {
    console.error('Add heir error:', error);
    res.status(500).json({ error: 'Failed to add heir' });
  }
});

// Get heir details
router.get('/:heirId', (req, res) => {
  try {
    const db = req.app.locals.db;
    const heir = db.prepare(`
      SELECT id, name, email, relationship, inheritance_share, permissions, status, confirmed_at
      FROM heirs 
      WHERE id = ? AND user_id = ?
    `).get(req.params.heirId, req.userId);

    if (!heir) {
      return res.status(404).json({ error: 'Heir not found' });
    }

    res.json({
      ...heir,
      permissions: JSON.parse(heir.permissions || '[]')
    });
  } catch (error) {
    console.error('Get heir error:', error);
    res.status(500).json({ error: 'Failed to fetch heir' });
  }
});

// Update heir
router.put('/:heirId', (req, res) => {
  try {
    const { name, relationship, inheritanceShare, permissions } = req.body;
    const db = req.app.locals.db;

    const heir = db.prepare('SELECT id FROM heirs WHERE id = ? AND user_id = ?')
      .get(req.params.heirId, req.userId);

    if (!heir) {
      return res.status(404).json({ error: 'Heir not found' });
    }

    db.prepare(`
      UPDATE heirs 
      SET name = ?, relationship = ?, inheritance_share = ?, 
          permissions = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || undefined,
      relationship || undefined,
      inheritanceShare || undefined,
      JSON.stringify(permissions || []),
      req.params.heirId
    );

    res.json({ message: 'Heir updated' });
  } catch (error) {
    console.error('Update heir error:', error);
    res.status(500).json({ error: 'Failed to update heir' });
  }
});

// Confirm heir (heir accepts invitation)
router.post('/:heirId/confirm', (req, res) => {
  try {
    const { email } = req.body;
    const db = req.app.locals.db;

    const heir = db.prepare('SELECT * FROM heirs WHERE id = ? AND status = ?')
      .get(req.params.heirId, 'pending');

    if (!heir || heir.email !== email) {
      return res.status(404).json({ error: 'Heir invitation not found' });
    }

    db.prepare(`
      UPDATE heirs 
      SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.heirId);

    res.json({ message: 'Heir confirmed' });
  } catch (error) {
    console.error('Confirm heir error:', error);
    res.status(500).json({ error: 'Failed to confirm heir' });
  }
});

// Delete heir
router.delete('/:heirId', (req, res) => {
  try {
    const db = req.app.locals.db;

    const heir = db.prepare('SELECT id FROM heirs WHERE id = ? AND user_id = ?')
      .get(req.params.heirId, req.userId);

    if (!heir) {
      return res.status(404).json({ error: 'Heir not found' });
    }

    db.prepare('DELETE FROM heirs WHERE id = ?').run(req.params.heirId);

    res.json({ message: 'Heir removed' });
  } catch (error) {
    console.error('Delete heir error:', error);
    res.status(500).json({ error: 'Failed to remove heir' });
  }
});

// Get heir inheritance distribution
router.get('/distribution/summary', (req, res) => {
  try {
    const db = req.app.locals.db;
    const heirs = db.prepare(`
      SELECT id, name, inheritance_share 
      FROM heirs 
      WHERE user_id = ? AND status = 'confirmed'
      ORDER BY inheritance_share DESC
    `).all(req.userId);

    const totalShare = heirs.reduce((sum, heir) => sum + heir.inheritance_share, 0);

    res.json({
      totalHeirs: heirs.length,
      heirs: heirs.map(heir => ({
        ...heir,
        percentageOfTotal: ((heir.inheritance_share / totalShare) * 100).toFixed(2)
      })),
      totalShare
    });
  } catch (error) {
    console.error('Distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch distribution' });
  }
});

// List pending heir confirmations
router.get('/status/pending', (req, res) => {
  try {
    const db = req.app.locals.db;
    const pending = db.prepare(`
      SELECT id, email, name, created_at
      FROM heirs 
      WHERE user_id = ? AND status = 'pending'
      ORDER BY created_at
    `).all(req.userId);

    res.json(pending);
  } catch (error) {
    console.error('Pending heirs error:', error);
    res.status(500).json({ error: 'Failed to fetch pending heirs' });
  }
});

export default router;