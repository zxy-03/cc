import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class CryptoUtil {
  private secretKey: Buffer;

  constructor(secretKey: string) {
    if (secretKey.length < KEY_LENGTH) {
      throw new Error('Encryption key must be at least 32 characters');
    }
    this.secretKey = Buffer.from(secretKey.slice(0, KEY_LENGTH), 'utf8');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivB64, authTagB64, encryptedB64] = encryptedText.split(':');
    if (!ivB64 || !authTagB64 || !encryptedB64) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, this.secretKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  static generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }
}

export const loadEncryptedEnv = (): void => {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    console.warn('ENCRYPTION_KEY not set, using plaintext environment variables');
    return;
  }

  const cryptoUtil = new CryptoUtil(encryptionKey);
  const encryptedKeys = [
    'ANTHROPIC_API_KEY',
    'DEEPSEEK_API_KEY',
    'DEEPSEEK_R1_API_KEY',
    'DEEPSEEK_MOE_API_KEY',
  ];

  encryptedKeys.forEach((key) => {
    const encryptedValue = process.env[key];
    if (encryptedValue && encryptedValue.includes(':')) {
      try {
        const decryptedValue = cryptoUtil.decrypt(encryptedValue);
        process.env[key] = decryptedValue;
        console.log(`Decrypted ${key}`);
      } catch (error) {
        console.error(`Failed to decrypt ${key}:`, error);
      }
    }
  });
};
