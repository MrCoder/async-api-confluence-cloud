/**
 * ESM utilities for Node.js 22 compatibility
 * Handles dynamic imports and module loading
 */

/**
 * Dynamic import with fallback for older environments
 * @param modulePath - Path to module to import
 * @returns Promise resolving to module
 */
export async function dynamicImport<T = any>(modulePath: string): Promise<T> {
  try {
    // Use dynamic import (ES2022)
    const module = await import(modulePath);
    return module.default || module;
  } catch (error) {
    // Fallback for environments that don't support dynamic import
    console.warn(`Dynamic import failed for ${modulePath}, falling back to require`);
    
    if (typeof require !== 'undefined') {
      return require(modulePath);
    }
    
    throw new Error(`Cannot load module: ${modulePath}`);
  }
}

/**
 * Check if running in ES module environment
 * @returns True if ES modules are supported
 */
export function isESMEnvironment(): boolean {
  try {
    // Check if dynamic import is available
    return typeof import === 'function';
  } catch {
    return false;
  }
}

/**
 * Load JSON module safely
 * @param jsonPath - Path to JSON file
 * @returns Promise resolving to JSON data
 */
export async function loadJSONModule<T = any>(jsonPath: string): Promise<T> {
  try {
    // In Node.js 22, JSON modules can be imported directly
    const module = await import(jsonPath, { assert: { type: 'json' } });
    return module.default;
  } catch (error) {
    // Fallback to fetch for browser environments
    if (typeof fetch !== 'undefined') {
      const response = await fetch(jsonPath);
      return response.json();
    }
    
    throw new Error(`Cannot load JSON module: ${jsonPath}`);
  }
}