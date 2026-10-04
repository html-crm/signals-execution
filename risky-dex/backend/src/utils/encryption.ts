import CryptoJS from 'crypto-js';
import { config } from '../config';

const ENCRYPTION_KEY = config.encryption.key;

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function encryptObject(obj: Record<string, unknown>): Record<string, string> {
  const encrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    encrypted[key] = encrypt(JSON.stringify(value));
  }
  return encrypted;
}

export function decryptObject(obj: Record<string, string>): Record<string, unknown> {
  const decrypted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    try {
      decrypted[key] = JSON.parse(decrypt(value));
    } catch {
      decrypted[key] = decrypt(value);
    }
  }
  return decrypted;
}
