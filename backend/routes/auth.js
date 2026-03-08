import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, authenticateToken, logAudit } from '../middleware/auth.js';
import { generateSecureToken, hashPasswordForStorage, verifyStoredPassword } from '../utils/encryption.js';

const router = express.Router();

// Register (same as signup)
router.post('/register', (req, res) => {
  const { email, password, securityQuestions } = req.body;
  const db = req.app.locals.db;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userId = uuidv4();
    const passwordHash = hashPasswordForStorage(password);
    const masterKeySalt = generateSecureToken(32);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, master_key_salt, security_questions)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, masterKeySalt, JSON.stringify(securityQuestions || {}));

    const token = generateToken(userId);
    logAudit(db, userId, 'signup', 'users', userId, req.ip, 'success', { email });

    res.json({
      userId,
      token,
      email,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Signup (same as register)
router.post('/signup', (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const db = req.app.locals.db;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = uuidv4();
    const passwordHash = hashPasswordForStorage(password);
    const masterKeySalt = generateSecureToken(32);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, master_key_salt)
      VALUES (?, ?, ?, ?)
    `).run(userId, email, passwordHash, masterKeySalt);

    const token = generateToken(userId);

    logAudit(db, userId, 'signup', 'users', userId, req.ip, 'success', { email });

    res.json({
      userId,
      token,
      email,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!verifyStoredPassword(password, user.password_hash)) {
      logAudit(db, user.id, 'login', 'users', user.id, req.ip, 'failed', { reason: 'invalid_password' });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    // Update last activity
    db.prepare('UPDATE users SET last_activity = datetime("now") WHERE id = ?').run(user.id);

    logAudit(db, user.id, 'login', 'users', user.id, req.ip, 'success', {});

    res.json({
      userId: user.id,
      token,
      email: user.email,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user (me endpoint)
router.get('/me', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = db.prepare(`
      SELECT id, email, storage_limit_gb, storage_used_mb, status, created_at 
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const heirCount = db.prepare('SELECT COUNT(*) as count FROM heirs WHERE user_id = ?').get(userId);
    const vaultCount = db.prepare('SELECT COUNT(*) as count FROM vaults WHERE user_id = ?').get(userId);

    res.json({
      id: user.id,
      userId: user.id,
      email: user.email,
      storage_limit_gb: user.storage_limit_gb,
      storage_used_mb: user.storage_used_mb,
      status: user.status,
      created_at: user.created_at,
      heirCount: heirCount.count,
      vaultCount: vaultCount.count
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = db.prepare(`
      SELECT id, email, storage_limit_gb, storage_used_mb, status, created_at 
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.id,
      email: user.email,
      storageLimit: user.storage_limit_gb,
      storageUsed: user.storage_used_mb,
      status: user.status,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update password
router.post('/update-password', authenticateToken, (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const db = req.app.locals.db;
  const userId = req.userId;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);

    if (!verifyStoredPassword(oldPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = hashPasswordForStorage(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, userId);

    logAudit(db, userId, 'password_change', 'users', userId, req.ip, 'success', {});

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Password update failed' });
  }
});

// Change password (alias for update-password)
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = req.app.locals.db;
  const userId = req.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);

    if (!verifyStoredPassword(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password incorrect' });
    }

    const newPasswordHash = hashPasswordForStorage(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, userId);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Get security settings
router.get('/security', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;

  try {
    const user = db.prepare('SELECT security_questions, emergency_contacts FROM users WHERE id = ?').get(userId);

    res.json({
      securityQuestions: user?.security_questions ? JSON.parse(user.security_questions) : {},
      emergencyContacts: user?.emergency_contacts ? JSON.parse(user.emergency_contacts) : []
    });
  } catch (error) {
    console.error('Get security error:', error);
    res.status(500).json({ error: 'Failed to fetch security settings' });
  }
});

// Update security settings
router.post('/security', authenticateToken, (req, res) => {
  const { securityQuestions, emergencyContacts } = req.body;
  const db = req.app.locals.db;
  const userId = req.userId;

  try {
    db.prepare(`
      UPDATE users 
      SET security_questions = ?, emergency_contacts = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      JSON.stringify(securityQuestions),
      JSON.stringify(emergencyContacts),
      userId
    );

    res.json({ message: 'Security settings updated' });
  } catch (error) {
    console.error('Update security error:', error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

export default router;