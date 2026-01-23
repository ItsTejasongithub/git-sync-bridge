/**
 * Cryptographic Service for Secure Asset Data Broadcast
 * Uses AES-256-GCM for encryption with authentication
 */

import crypto from 'crypto';

// Constants
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits

export interface SessionKey {
  key: Buffer;
  createdAt: number;
  roomId: string;
}

export interface EncryptedPayload {
  iv: string; // base64 encoded
  data: string; // base64 encoded ciphertext
  tag: string; // base64 encoded auth tag
  ts: number; // timestamp for replay protection
}

/**
 * Generate a cryptographically secure session key
 */
export function generateSessionKey(roomId: string): SessionKey {
  return {
    key: crypto.randomBytes(KEY_LENGTH),
    createdAt: Date.now(),
    roomId,
  };
}

/**
 * Encrypt data using AES-256-GCM
 * Returns an encrypted payload that can be safely transmitted
 */
export function encrypt(data: any, sessionKey: Buffer): EncryptedPayload {
  // Generate a random IV for each encryption
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, sessionKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt the data
  const jsonData = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(jsonData, 'utf8'),
    cipher.final(),
  ]);

  // Get the authentication tag
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    data: encrypted.toString('base64'),
    tag: authTag.toString('base64'),
    ts: Date.now(),
  };
}

/**
 * Decrypt data using AES-256-GCM
 * Throws if authentication fails (tampering detected)
 */
export function decrypt(payload: EncryptedPayload, sessionKey: Buffer): any {
  // Decode from base64
  const iv = Buffer.from(payload.iv, 'base64');
  const encrypted = Buffer.from(payload.data, 'base64');
  const authTag = Buffer.from(payload.tag, 'base64');

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, sessionKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Set the auth tag for verification
  decipher.setAuthTag(authTag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Verify a payload's timestamp is within acceptable window
 * Helps prevent replay attacks
 */
export function isPayloadFresh(
  payload: EncryptedPayload,
  maxAgeMs: number = 30000
): boolean {
  const age = Date.now() - payload.ts;
  return age >= 0 && age <= maxAgeMs;
}

/**
 * Generate a random room code (6 alphanumeric characters)
 * Not cryptographic, just for room identification
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0/O, 1/I
  let code = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

/**
 * Hash a string using SHA-256 (for logging/debugging without exposing sensitive data)
 */
export function hashForLogging(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}
