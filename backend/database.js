export function initializeDatabase(db) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      master_key_salt TEXT NOT NULL,
      auth_timestamp DATETIME,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      security_questions TEXT,
      emergency_contacts TEXT,
      storage_limit_gb INTEGER DEFAULT 5,
      storage_used_mb REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Vaults table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      encrypted_content BLOB NOT NULL,
      encryption_nonce TEXT NOT NULL,
      file_type TEXT,
      file_name TEXT,
      file_size_bytes INTEGER,
      recipients TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Heirs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS heirs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      relationship TEXT,
      inheritance_share REAL DEFAULT 100,
      permissions TEXT DEFAULT '["read"]',
      heir_public_key TEXT,
      status TEXT DEFAULT 'pending',
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Inheritance rules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inheritance_rules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      trigger_condition TEXT NOT NULL,
      release_date DATETIME,
      inactivity_days INTEGER,
      beneficiaries TEXT,
      affected_vaults TEXT,
      status TEXT DEFAULT 'active',
      triggered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      encrypted_content BLOB NOT NULL,
      encryption_nonce TEXT NOT NULL,
      recipient_heir_id TEXT,
      delivery_date DATETIME,
      is_delivered BOOLEAN DEFAULT 0,
      message_type TEXT,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_heir_id) REFERENCES heirs(id) ON DELETE SET NULL
    )
  `);

  // Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      ip_address TEXT,
      status TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Smart contracts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS smart_contracts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      contract_type TEXT NOT NULL,
      contract_address TEXT,
      network TEXT,
      encrypted_abi BLOB,
      beneficiaries TEXT,
      status TEXT DEFAULT 'draft',
      deployed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Heir access logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS heir_access_logs (
      id TEXT PRIMARY KEY,
      heir_id TEXT NOT NULL,
      vault_id TEXT,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      access_type TEXT,
      ip_address TEXT,
      FOREIGN KEY (heir_id) REFERENCES heirs(id) ON DELETE CASCADE,
      FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE SET NULL
    )
  `);

  console.log('Database initialized successfully');
}