import { sha256 } from '../src/sha256';
import { Hex } from '../src/hex';

describe('SHA-256 Hashing', () => {
  const encoder = new TextEncoder();
  it('should correctly hash a string', () => {
    const suite = [
      {
        input: 'Hello, World!',
        expectedHash: 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f'
      },
      {
        input: 'London is the capital of Great Britain',
        expectedHash: '9d32c323980e796968b64f912ca6fa52e7cf3ea5431f8b28a7671b5ec1fdc53b'
      },
      {
        input: 'The quick brown fox jumps over the lazy dog',
        expectedHash: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'
      },
      {
        input: 'Tets message',
        expectedHash: 'dffb29c8f6c14f16bfedd2a81a10986e5828ab6613a7428b1549d5f890e03418'
      }
    ];
    for (const { input, expectedHash } of suite) {
      const result = Hex.encodeString(sha256(encoder.encode(input)));
      expect(result).toEqual(expectedHash);
    }
  });

  it('should return the same hash for the same input', () => {
    const input = 'Hello, World!';
    const expectedHash = 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f';

    const result1 = Hex.encodeString(sha256(encoder.encode(input)));
    const result2 = Hex.encodeString(sha256(encoder.encode(input)));

    expect(result1).toEqual(expectedHash);
    expect(result2).toEqual(expectedHash);
  });

  it('should hash different inputs to different values', () => {
    const input1 = 'Hello, World!';
    const input2 = 'Hello, Goodbay!';
    const hash1 = sha256(encoder.encode(input1));
    const hash2 = sha256(encoder.encode(input2));

    expect(hash1).not.toEqual(hash2);
  });
});
