import crypto from 'crypto';

/**
 * Generate a secure random token for password reset
 * @returns A random 32-byte token encoded in hex (64 characters)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash the reset token for storage in database
 * @param token The plain reset token
 * @returns Hashed token
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify if the provided token matches the hashed token
 * @param token The plain token from user
 * @param hashedToken The hashed token from database
 * @returns True if tokens match
 */
export function verifyResetToken(token: string, hashedToken: string): boolean {
  const tokenHash = hashResetToken(token);
  return tokenHash === hashedToken;
}
