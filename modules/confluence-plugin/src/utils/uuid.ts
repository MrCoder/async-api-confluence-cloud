/**
 * Modern UUID generation utilities for Node.js 22
 * Replaces the legacy uuid.js file
 */

import { generateUUID } from './crypto-utils';

/**
 * Generate a UUID v4 string
 * Uses crypto.randomUUID when available, falls back to polyfill
 */
export default function uuidv4(): string {
  return generateUUID();
}

/**
 * Named export for consistency
 */
export { uuidv4 };