import * as crypto from 'crypto';
import { JwtPayload } from '../types/saas';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = 15 * 60;
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

function createSignature(header: string, payload: string): string {
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${header}.${payload}`);
  return hmac.digest('base64url');
}

export function generateAccessToken(userId: string, tenantId: string, role: string): string {
  const now = Math.floor(Date.now() / 1000);

  const payload: JwtPayload = {
    sub: userId,
    tenantId,
    role,
    type: 'access',
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRY,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(header, payloadEncoded);

  return `${header}.${payloadEncoded}.${signature}`;
}

export function generateRefreshToken(userId: string, tenantId: string, role: string): string {
  const now = Math.floor(Date.now() / 1000);

  const payload: JwtPayload = {
    sub: userId,
    tenantId,
    role,
    type: 'refresh',
    iat: now,
    exp: now + REFRESH_TOKEN_EXPIRY,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(header, payloadEncoded);

  return `${header}.${payloadEncoded}.${signature}`;
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = createSignature(header, payload);

    if (signature !== expectedSignature) return null;

    const payloadData: JwtPayload = JSON.parse(base64UrlDecode(payload));

    const now = Math.floor(Date.now() / 1000);
    if (payloadData.exp < now) return null;

    return payloadData;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function extractApiKeyFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer sk_')) {
    return authHeader;
  }
  if (authHeader.startsWith('sk_')) {
    return authHeader;
  }
  return null;
}