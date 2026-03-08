import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cron from 'node-cron';

import { initializeDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import vaultRoutes from './routes/vault.js';
import heirRoutes from './routes/heirs.js';
import inheritanceRoutes from './routes/inheritance.js';
import messagesRoutes from './routes/messages.js';
import smartContractsRoutes from './routes/smartContracts.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database(join(__dirname, 'database.db'));
initializeDatabase(db);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Make db globally accessible
app.locals.db = db;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', authenticateToken, vaultRoutes);
app.use('/api/heirs', authenticateToken, heirRoutes);
app.use('/api/inheritance', authenticateToken, inheritanceRoutes);
app.use('/api/messages', authenticateToken, messagesRoutes);
app.use('/api/smart-contracts', authenticateToken, smartContractsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Cron jobs for dead-man switch and scheduled releases
cron.schedule('0 * * * *', () => {
  console.log('Running inactivity check...');
  checkInactivityTriggers(db);
});

cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled release check...');
  checkScheduledReleases(db);
});

// Check inactivity for dead-man switch
function checkInactivityTriggers(db) {
  try {
    const rules = db.prepare(`
      SELECT ir.*, u.email 
      FROM inheritance_rules ir
      JOIN users u ON ir.user_id = u.id
      WHERE ir.rule_type = 'dead_man_switch' AND ir.status = 'active'
    `).all();

    const now = new Date();
    for (const rule of rules) {
      const trigger = JSON.parse(rule.trigger_condition);
      const inactivityDays = trigger.inactivity_days || 180;
      const lastActivity = new Date(rule.trigger_condition_at || rule.created_at);
      const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

      if (daysSinceActivity >= inactivityDays) {
        db.prepare(`
          UPDATE inheritance_rules 
          SET status = 'triggered' 
          WHERE id = ?
        `).run(rule.id);
        console.log(`Rule ${rule.id} triggered for user ${rule.user_id}`);
      }
    }
  } catch (error) {
    console.error('Error checking inactivity:', error);
  }
}

// Check scheduled releases
function checkScheduledReleases(db) {
  try {
    const rules = db.prepare(`
      SELECT ir.*, u.email 
      FROM inheritance_rules ir
      JOIN users u ON ir.user_id = u.id
      WHERE ir.rule_type = 'time_locked' AND ir.status = 'active' AND ir.release_date <= datetime('now')
    `).all();

    for (const rule of rules) {
      db.prepare(`
        UPDATE inheritance_rules 
        SET status = 'triggered' 
        WHERE id = ?
      `).run(rule.id);
      console.log(`Time-locked rule ${rule.id} released for user ${rule.user_id}`);
    }
  } catch (error) {
    console.error('Error checking scheduled releases:', error);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Novra Backend running on http://0.0.0.0:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});

export default app;