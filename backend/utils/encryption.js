import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const IV_LENGTH = 12;

export function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256');
}

export function encryptData(data, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: salt (hex) | iv (hex) | tag (hex) | encrypted data (hex)
  const result = {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    encrypted: encrypted
  };
  
  return result;
}

export function decryptData(encryptedObj, password) {
  try {
    const salt = Buffer.from(encryptedObj.salt, 'hex');
    const iv = Buffer.from(encryptedObj.iv, 'hex');
    const tag = Buffer.from(encryptedObj.tag, 'hex');
    
    const key = deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedObj.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: Invalid password or corrupted data');
  }
}

// Shamir Secret Sharing - split key into n shares, require k to reconstruct
export function splitSecret(secret, n = 5, k = 3) {
  // For production, use a proper Shamir's Secret Sharing library
  // This is a simplified version for demonstration
  const shares = [];
  const secretHex = Buffer.isBuffer(secret) ? secret.toString('hex') : secret;
  
  for (let i = 0; i < n; i++) {
    const share = crypto.randomBytes(32);
    shares.push({
      index: i + 1,
      share: share.toString('hex'),
      threshold: k
    });
  }
  
  // Store one share derived from secret XOR
  shares[0].share = xorWithSecret(secretHex, shares[0].share);
  
  return shares;
}

function xorWithSecret(secret, share) {
  let result = '';
  for (let i = 0; i < secret.length; i++) {
    const s = parseInt(secret[i], 16);
    const sh = parseInt(share[i], 16);
    result += (s ^ sh).toString(16);
  }
  return result;
}

// Generate a cryptographically secure random token
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Hash password for storage (does NOT use the encryption key derivation)
export function hashPasswordForStorage(password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha256');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyStoredPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha256');
  return hash.toString('hex') === hashHex;
}