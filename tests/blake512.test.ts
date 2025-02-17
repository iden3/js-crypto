import { Hex } from '../src';
import { blake512 } from '@noble/hashes/blake1';

describe('blake512 hash', () => {
  it('blake512', () => {
    const inp = Uint8Array.from([
      83, 136, 42, 97, 189, 0, 74, 35, 110, 241, 205, 186, 1, 178, 123, 160, 174, 223, 176, 142,
      239, 219, 251, 124, 25, 101, 124, 136, 11, 67, 221, 241, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ]);

    const expected = Uint8Array.from([
      154, 151, 79, 234, 210, 119, 122, 159, 95, 97, 56, 1, 80, 12, 20, 151, 21, 173, 150, 73, 139,
      79, 254, 193, 38, 81, 90, 154, 2, 53, 29, 129, 67, 181, 131, 94, 196, 157, 72, 55, 68, 36,
      202, 210, 113, 9, 3, 87, 144, 27, 14, 142, 32, 80, 101, 157, 158, 111, 19, 166, 210, 170, 217,
      210
    ]);

    const inHex = Hex.encodeString(inp);
    expect(inHex).toEqual(
      '53882a61bd004a236ef1cdba01b27ba0aedfb08eefdbfb7c19657c880b43ddf10001020304050607080900000000000000000000000000000000000000000000'
    );

    const expectedHex = Hex.encodeString(expected);

    expect(expectedHex).toEqual(
      '9a974fead2777a9f5f613801500c149715ad96498b4ffec126515a9a02351d8143b5835ec49d48374424cad271090357901b0e8e2050659d9e6f13a6d2aad9d2'
    );

    const mH = Hex.encodeString(blake512(inp));

    expect(mH).toEqual(expectedHex);
  });
});
