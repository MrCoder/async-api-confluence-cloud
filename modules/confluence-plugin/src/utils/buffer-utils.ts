/**
 * Buffer utilities for Node.js 22 compatibility
 * Provides safe buffer operations across different environments
 */

/**
 * Convert string to buffer safely
 * @param str - String to convert
 * @param encoding - Encoding to use (default: utf8)
 * @returns Buffer
 */
export function stringToBuffer(str: string, encoding: BufferEncoding = 'utf8'): Buffer {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, encoding);
  }
  
  // Fallback for environments without Buffer
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(str);
  return uint8Array as any; // Type assertion for compatibility
}

/**
 * Convert buffer to string safely
 * @param buffer - Buffer to convert
 * @param encoding - Encoding to use (default: utf8)
 * @returns String
 */
export function bufferToString(buffer: Buffer | Uint8Array, encoding: BufferEncoding = 'utf8'): string {
  if (Buffer.isBuffer(buffer)) {
    return buffer.toString(encoding);
  }
  
  // Handle Uint8Array
  if (buffer instanceof Uint8Array) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
  }
  
  throw new Error('Invalid buffer type');
}

/**
 * Concatenate buffers safely
 * @param buffers - Array of buffers to concatenate
 * @returns Concatenated buffer
 */
export function concatBuffers(buffers: (Buffer | Uint8Array)[]): Buffer {
  if (typeof Buffer !== 'undefined' && Buffer.concat) {
    return Buffer.concat(buffers as Buffer[]);
  }
  
  // Fallback implementation
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  
  return result as any; // Type assertion for compatibility
}

/**
 * Check if value is a buffer
 * @param value - Value to check
 * @returns True if value is a buffer
 */
export function isBuffer(value: any): value is Buffer {
  return typeof Buffer !== 'undefined' && Buffer.isBuffer(value);
}