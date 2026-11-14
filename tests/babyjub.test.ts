import { describe, expect, it } from 'vitest';
import { babyJub, ffUtils, Hex, PrivateKey, PublicKey, Signature } from '../src';

describe('eddsa keys(Private, Public, Signature)', () => {
  it('pub key hex compress & decompress', () => {
    const x = BigInt(
      '17777552123799933955779906779655732241715742912184938656739573121738514868268'
    );
    const y = BigInt(
      '2626589144620713026669568689430873010625803728049924121243784502389097019475'
    );
    const expectedHex = '53b81ed5bffe9545b54016234682e7b2f699bd42a5e9eae27ff4051bc698ce85';
    const pKey = new PublicKey([x, y]);

    const compressedPKey = pKey.compress();

    expect(Hex.encodeString(compressedPKey)).toEqual(expectedHex);
    expect(pKey.hex()).toEqual(expectedHex);

    const fromHexPKey = PublicKey.newFromHex(expectedHex);

    expect(fromHexPKey.p[0]).toEqual(x);
    expect(fromHexPKey.p[1]).toEqual(y);
  });

  it('test signature flow', () => {
    const msgBuf = Hex.decodeString('000102030405060708090000');
    const msg = ffUtils.leBuff2int(msgBuf);

    const skBuff = Hex.decodeString(
      '0001020304050607080900010203040506070809000102030405060708090001'
    );

    const privateKey = new PrivateKey(skBuff);

    const pubKey = privateKey.public();
    expect(pubKey.p[0].toString()).toEqual(
      '13277427435165878497778222415993513565335242147425444199013288855685581939618'
    );
    expect(pubKey.p[1].toString()).toEqual(
      '13622229784656158136036771217484571176836296686641868549125388198837476602820'
    );

    const signature = privateKey.signPoseidon(msg);

    expect(signature.R8[0].toString()).toEqual(
      '11384336176656855268977457483345535180380036354188103142384839473266348197733'
    );
    expect(signature.R8[1].toString()).toEqual(
      '15383486972088797283337779941324724402501462225528836549661220478783371668959'
    );
    expect(signature.S.toString()).toEqual(
      '1672775540645840396591609181675628451599263765380031905495115170613215233181'
    );

    const pSignature = signature.compress();
    expect(Hex.encodeString(pSignature)).toEqual(
      '' +
        'dfedb4315d3f2eb4de2d3c510d7a987dcab67089c8ace06308827bf5bcbe02a2' +
        '9d043ece562a8f82bfc0adb640c0107a7d3a27c1c7c1a6179a0da73de5c1b203'
    );
    expect(signature.hex()).toEqual(
      '' +
        'dfedb4315d3f2eb4de2d3c510d7a987dcab67089c8ace06308827bf5bcbe02a2' +
        '9d043ece562a8f82bfc0adb640c0107a7d3a27c1c7c1a6179a0da73de5c1b203'
    );

    const uSignature = Signature.newFromCompressed(pSignature);

    expect(pubKey.verifyPoseidon(msg, uSignature)).toBeTruthy();
  });

  it('Private key toBigInt', () => {
    const skBuff = Uint8Array.from(new Array(32).fill(1).map((_, i) => i));

    const privateKey = new PrivateKey(skBuff);

    expect(privateKey.bigInt().toString()).toEqual(
      '3817885988578745122822765953778691808009834824977012551803821922027918401423'
    );
  });
});

describe('babyJub.unpackPoint', () => {
  const toLE = (n: bigint) => {
    const b = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      b[i] = Number(n & 255n);
      n >>= 8n;
    }
    return b;
  };

  it('does not modify the buffer passed to it', () => {
    const pub = new PrivateKey(new Uint8Array(32).fill(7)).public();
    const buf = pub.compress();
    const copy = buf.slice();

    const p1 = PublicKey.newFromCompressed(buf);
    expect(buf).toEqual(copy);

    const p2 = PublicKey.newFromCompressed(buf);
    expect(p2.p).toEqual(p1.p);
    expect(p1.p).toEqual(pub.p);
  });

  it('rejects a non-canonical y coordinate (y >= p)', () => {
    // y = 0 is on the curve, y = p and y = p + 1 would decode to the points with y = 0 and y = 1
    expect(babyJub.unpackPoint(toLE(0n))).not.toBeNull();
    expect(babyJub.unpackPoint(toLE(babyJub.p))).toBeNull();
    expect(babyJub.unpackPoint(toLE(babyJub.p + 1n))).toBeNull();
  });

  it('unpacks the identity and rejects it with the sign bit set', () => {
    const buf = babyJub.packPoint([0n, 1n]);
    expect(babyJub.unpackPoint(buf)).toEqual([0n, 1n]);

    buf[31] |= 0x80;
    expect(babyJub.unpackPoint(buf)).toBeNull();
  });
});
