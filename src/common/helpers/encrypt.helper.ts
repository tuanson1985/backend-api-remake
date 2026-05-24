import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function normalizeKey(appKey: string): Buffer {
  return Buffer.from(appKey.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH), 'utf8');
}

export function encrypt(text: string, appKey: string): string {
  const key = normalizeKey(appKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(encryptedText: string, appKey: string): string {
  const [ivHex, dataHex] = encryptedText.split(':');
  const key = normalizeKey(appKey);
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

export function generateSecretKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
