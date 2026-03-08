import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'novra-secret-key-change-in-production';

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function verifyPassword(plainPassword, hash) {
  return bcryptjs.compareSync(plainPassword, hash);
}

export function hashPassword(password) {
  return bcryptjs.hashSync(password, 10);
}

export function logAudit(db, userId, action, resource, resourceId, ipAddress, status, details) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, resource, resource_id, ip_address, status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, action, resource, resourceId, ipAddress, status, JSON.stringify(details));
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}