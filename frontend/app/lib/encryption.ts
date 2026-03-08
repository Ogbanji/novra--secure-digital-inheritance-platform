import CryptoJS from 'crypto-js';

// Generate random nonce for AES encryption
export function generateNonce(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

// Generate salt for key derivation
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Derive key from password using PBKDF2
export function deriveKey(password: string, salt: string): string {
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000
  });
  return key.toString();
}

// Encrypt data using AES
export function encryptData(plaintext: any, key: string, nonce: string): { encrypted: string; authTag: string } {
  try {
    // Convert to JSON if object
    const jsonString = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);

    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
      iv: CryptoJS.enc.Hex.parse(nonce),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      encrypted: encrypted.toString(),
      authTag: CryptoJS.MD5(encrypted.toString()).toString()
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
}

// Decrypt data using AES
export function decryptData(encrypted: string, key: string, nonce: string): any {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(nonce),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(plaintext);
    } catch {
      return plaintext;
    }
  } catch (error) {
    throw new Error(`Decryption failed: ${error}`);
  }
}

// Encrypt binary data (for files)
export function encryptBinaryData(data: ArrayBuffer | Buffer, key: string, nonce: string): { encrypted: string; authTag: string } {
  try {
    // Convert binary to hex string
    const hexString = Array.from(new Uint8Array(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const encrypted = CryptoJS.AES.encrypt(hexString, key, {
      iv: CryptoJS.enc.Hex.parse(nonce),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      encrypted: encrypted.toString(),
      authTag: CryptoJS.MD5(encrypted.toString()).toString()
    };
  } catch (error) {
    throw new Error(`Binary encryption failed: ${error}`);
  }
}

// Decrypt binary data
export function decryptBinaryData(encrypted: string, key: string, nonce: string): Uint8Array {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(nonce),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const hexString = decrypted.toString(CryptoJS.enc.Utf8);
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(parseInt(hexString.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
  } catch (error) {
    throw new Error(`Binary decryption failed: ${error}`);
  }
}

// Hash password
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = generateSalt();
  const hash = deriveKey(password, salt);
  return { salt, hash };
}

// Verify password
export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const derived = deriveKey(password, salt);
    return derived === hash;
  } catch {
    return false;
  }
}

// Hash data with SHA256
export function hashSHA256(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

// Create digital signature
export function signMessage(message: string, privateKey: string): string {
  return CryptoJS.HmacSHA256(message, privateKey).toString();
}

// Verify digital signature
export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  const expectedSignature = CryptoJS.HmacSHA256(message, publicKey).toString();
  return signature === expectedSignature;
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
  hashSHA256,
  signMessage,
  verifySignature
};