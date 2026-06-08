/**
 * Type definition for the browser crypto object.
 */
type BrowserCrypto = { crypto?: { getRandomValues?: (arg0: Uint8Array) => void } };

export function getRandomBytes(length: number): Uint8Array {
  if (length <= 0) {
    throw new Error('Length must be greater than 0');
  }
  const global = globalThis as BrowserCrypto;
  if (global.crypto?.getRandomValues) {
    const randomValues = new Uint8Array(length);
    global.crypto.getRandomValues(randomValues);
    return randomValues;
  }
  try {
    const crypto = require('node:crypto');
    return crypto.randomBytes(length);
  } catch {
    throw new Error('Random byte generation is not supported in this environment');
  }
}
