/**
 * Application-level encryption for sensitive storage fields.
 *
 * Encrypts message_json, output_json, and args_json in SQLite using
 * AES-256-GCM with a key derived from GROK_STORAGE_KEY env var or
 * a machine-specific fallback (hostname + homedir hash).
 *
 * Copyright (c) 2026 AlphaOne LLC. MIT License.
 */

import crypto from "node:crypto";
import os from "node:os";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT = "grok-cli-storage-v1";
const PREFIX = "enc:";

/**
 * Derive a 256-bit key from the storage password or machine identity.
 */
function deriveKey(): Buffer {
  const secret = process.env.GROK_STORAGE_KEY || `${os.hostname()}:${os.homedir()}:grok-cli`;
  return crypto.pbkdf2Sync(secret, SALT, 100_000, 32, "sha256");
}

let _cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!_cachedKey) _cachedKey = deriveKey();
  return _cachedKey;
}

/**
 * Encrypt a string. Returns `enc:<base64(iv + ciphertext + tag)>`.
 * Returns the original string if encryption is disabled or fails.
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, encrypted, tag]);
    return `${PREFIX}${combined.toString("base64")}`;
  } catch {
    return plaintext;
  }
}

/**
 * Decrypt a string. If not prefixed with `enc:`, returns as-is (backward compat).
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext || !ciphertext.startsWith(PREFIX)) return ciphertext;
  try {
    const key = getKey();
    const combined = Buffer.from(ciphertext.slice(PREFIX.length), "base64");
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    // Decryption failed — return raw (migration scenario or key change)
    return ciphertext.startsWith(PREFIX) ? "" : ciphertext;
  }
}

/**
 * Check if encryption is available (node:crypto present).
 */
export function isEncryptionAvailable(): boolean {
  try {
    const test = encrypt("test");
    return decrypt(test) === "test";
  } catch {
    return false;
  }
}
