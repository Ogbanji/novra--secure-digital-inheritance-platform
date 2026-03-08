import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all messages for user
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const messages = db.prepare(`
      SELECT m.id, m.title, m.message_type, m.delivery_date, m.is_delivered, m.created_at, h.name, h.email
      FROM messages m
      LEFT JOIN heirs h ON m.recipient_heir_id = h.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user.userId);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create message
router.post('/', (req, res) => {
  try {
    const { title, encryptedContent, authTag, nonce, recipientHeirId, messageType, deliveryDate } = req.body;
    const db = req.app.locals.db;

    if (!encryptedContent) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const messageId = uuidv4();

    db.prepare(`
      INSERT INTO messages (
        id, user_id, encrypted_content, encryption_nonce, 
        title, recipient_heir_id, message_type, delivery_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      messageId,
      req.user.userId,
      Buffer.from(encryptedContent, 'hex'),
      nonce,
      title || '',
      recipientHeirId || null,
      messageType || 'text',
      deliveryDate || null
    );

    res.status(201).json({
      message: 'Message created',
      messageId,
      title
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Get message
router.get('/:messageId', (req, res) => {
  try {
    const db = req.app.locals.db;
    const message = db.prepare(`
      SELECT * FROM messages 
      WHERE id = ? AND user_id = ?
    `).get(req.params.messageId, req.user.userId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({
      ...message,
      encrypted_content: message.encrypted_content.toString('hex')
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Update message
router.put('/:messageId', (req, res) => {
  try {
    const { title, deliveryDate } = req.body;
    const db = req.app.locals.db;

    const message = db.prepare('SELECT id FROM messages WHERE id = ? AND user_id = ?')
      .get(req.params.messageId, req.user.userId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    db.prepare(`
      UPDATE messages 
      SET title = ?, delivery_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title || undefined, deliveryDate || undefined, req.params.messageId);

    res.json({ message: 'Message updated' });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete message
router.delete('/:messageId', (req, res) => {
  try {
    const db = req.app.locals.db;

    const message = db.prepare('SELECT id FROM messages WHERE id = ? AND user_id = ?')
      .get(req.params.messageId, req.user.userId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.messageId);

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;