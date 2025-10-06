import * as sha2 from '@noble/hashes/sha2.js';

export function sha256(data: Uint8Array): Uint8Array {
  return sha2.sha256(data);
}
