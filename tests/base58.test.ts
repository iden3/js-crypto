import { Hex } from '../src';
import { base58ToBytes, base58FromBytes } from '../src/base58';
describe('base58', () => {
  it('base58 to binary', () => {
    const inp = '6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
    const expected = '02c0ded2bc1f1305fb0faac5e6c03ee3a1924234985427b6167ca569d13df435cfeb05f9d2';
    const inHex = Hex.encodeString(base58ToBytes(inp));
    expect(inHex).toEqual(expected);
    expect(() => base58ToBytes('0L')).toThrowError(`Can't convert base58 string 0L to bytes`);
  });

  it('base58 to binary', () => {
    expect(
      base58FromBytes(
        Hex.decodeString(
          '02c0ded2bc1f1305fb0faac5e6c03ee3a1924234985427b6167ca569d13df435cfeb05f9d2'
        )
      )
    ).toEqual('6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV');
    expect(base58FromBytes(Uint8Array.from([0, 0, 0, 4]))).toBe('1115');
  });
});
