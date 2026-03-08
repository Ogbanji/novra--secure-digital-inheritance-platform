import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// Generate random nonce for AES encryption
export function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

// Generate salt for key derivation
export function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

// Derive key from password using PBKDF2
export function deriveKey(password, salt) {
  const iterations = 100000;
  const keyLength = 32;
  const digest = 'sha256';
  
  return crypto
    .pbkdf2Sync(password, salt, iterations, keyLength, digest)
    .toString('hex');
}

// Encrypt data using AES-256-GCM
export function encryptData(plaintext, key, nonce) {
  try {
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(nonce, 'hex')
    );
    
    let encrypted = cipher.update(JSON.stringify(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      encrypted,
      authTag,
      nonce
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

// Decrypt data using AES-256-GCM
export function decryptData(encrypted, authTag, key, nonce) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(nonce, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// Encrypt binary data (for files)
export function encryptBinaryData(buffer, key, nonce) {
  try {
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(nonce, 'hex')
    );
    
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('hex'),
      authTag: authTag.toString('hex'),
      nonce
    };
  } catch (error) {
    throw new Error(`Binary encryption failed: ${error.message}`);
  }
}

// Decrypt binary data (for files)
export function decryptBinaryData(encrypted, authTag, key, nonce) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(nonce, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  } catch (error) {
    throw new Error(`Binary decryption failed: ${error.message}`);
  }
}

// Hash password with bcrypt-style implementation
export function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const key = deriveKey(password, salt);
  return `${salt}:${key}`;
}

// Verify password
export function verifyPassword(password, hash) {
  try {
    const [salt, key] = hash.split(':');
    const derivedKey = deriveKey(password, salt);
    return derivedKey === key;
  } catch (error) {
    return false;
  }
}

// Shamir's Secret Sharing - split key into shares
export function splitKeyIntoShares(masterKey, totalShares = 5, requiredShares = 3) {
  try {
    const secrets = require('secrets.js');
    
    // Convert key to hex format that secrets.js can handle
    const keyHex = Buffer.from(masterKey, 'utf8').toString('hex');
    
    // Generate shares
    const shares = secrets.share(keyHex, totalShares, requiredShares);
    
    return {
      shares: shares.map((share, index) => ({
        index: index + 1,
        share: share,
        required: requiredShares,
        total: totalShares
      })),
      masterKeyHash: crypto.createHash('sha256').update(masterKey).digest('hex')
    };
  } catch (error) {
    throw new Error(`Key sharing failed: ${error.message}`);
  }
}

// Reconstruct key from shares
export function reconstructKeyFromShares(shares) {
  try {
    const secrets = require('secrets.js');
    
    // Extract share data
    const shareData = shares.map(s => s.share);
    
    // Combine shares
    const keyHex = secrets.combine(shareData);
    
    // Convert back to UTF-8
    const masterKey = Buffer.from(keyHex, 'hex').toString('utf8');
    
    return masterKey;
  } catch (error) {
    throw new Error(`Key reconstruction failed: ${error.message}`);
  }
}

// Sign data with private key
export function signData(data, privateKey) {
  try {
    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(data));
    return sign.sign(privateKey, 'hex');
  } catch (error) {
    throw new Error(`Data signing failed: ${error.message}`);
  }
}

// Verify data signature
export function verifySignature(data, signature, publicKey) {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(JSON.stringify(data));
    return verify.verify(publicKey, signature, 'hex');
  } catch (error) {
    throw new Error(`Signature verification failed: ${error.message}`);
  }
}

// Generate RSA key pair for heir
export function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

// Encrypt data for specific heir using their public key
export function encryptForHeir(plaintext, heirPublicKey) {
  try {
    const encrypted = crypto.publicEncrypt(
      {
        key: heirPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(JSON.stringify(plaintext))
    );
    
    return encrypted.toString('base64');
  } catch (error) {
    throw new Error(`Heir encryption failed: ${error.message}`);
  }
}

export default {
  generateNonce,
  generateSalt,
  deriveKey,
  encryptData,
  decryptData,
  encryptBinaryData,
  decryptBinaryData,
  hashPassword,
  verifyPassword,
  splitKeyIntoShares,
  reconstructKeyFromShares,
  signData,
  verifySignature,
  generateKeyPair,
  encryptForHeir
};