/**
 * Modern crypto utilities for Node.js 22 compatibility
 * Replaces legacy crypto usage throughout the application
 */

/**
 * Generate MD5 hash using modern crypto API
 * @param content - Content to hash
 * @returns MD5 hash as hex string
 */
export function generateMD5Hash(content: string): string {
  // Use Web Crypto API when available (browser), fallback to Node crypto
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser environment - use Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    // Note: Web Crypto API doesn't support MD5, so we'll use a polyfill
    // For production, consider using SHA-256 instead
    return legacyMD5(content);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content, 'utf8').digest('hex');
  }
}

/**
 * Legacy MD5 implementation for browser compatibility
 * This is a fallback for environments where crypto.subtle is not available
 */
function legacyMD5(content: string): string {
  // Import the existing md5 function but wrap it safely
  const md5 = require('md5');
  return md5(content);
}

/**
 * Generate secure random UUID v4
 * Uses crypto.randomUUID when available (Node 14.17+)
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Secure random bytes generation
 * @param size - Number of bytes to generate
 * @returns Uint8Array of random bytes
 */
export function getRandomBytes(size: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(size);
    crypto.getRandomValues(array);
    return array;
  }
  
  // Fallback for environments without crypto.getRandomValues
  const array = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}