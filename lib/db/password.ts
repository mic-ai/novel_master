import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(':');
  if (!salt || !storedHash) return false;
  try {
    const hash = scryptSync(password, salt, 64);
    return timingSafeEqual(hash, Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}
