import { babyJub } from './babyjub';
import { eddsa } from './eddsa';

export class Signature {
  R8: [bigint, bigint];
  S: bigint;

  constructor(r8: [bigint, bigint], s: bigint) {
    this.R8 = r8;
    this.S = s;
  }

  static newFromCompressed(buf: Uint8Array): Signature {
    if (buf.length !== 64) {
      throw new Error('buf must be 64 bytes');
    }
    const sig = eddsa.unpackSignature(buf);
    if (sig.R8 == null) {
      throw new Error('unpackSignature failed');
    }
    return new Signature(sig.R8, sig.S);
  }

  compress(): Uint8Array {
    return eddsa.packSignature(this);
  }

  toString(): string {
    return this.compress().toString();
  }
}

export class PublicKey {
  p: [bigint, bigint];

  constructor(p: [bigint, bigint]) {
    this.p = p;
  }

  static newFromCompressed(buf: Uint8Array): PublicKey {
    if (buf.length !== 32) {
      throw new Error('buf must be 32 bytes');
    }
    // const bufLE = utils.swapEndianness(buf);
    const p = babyJub.unpackPoint(buf);
    if (p == null) {
      throw new Error('unpackPoint failed');
    }
    return new PublicKey(p);
  }

  compress(): Uint8Array {
    // return utils.swapEndianness(babyJub.packPoint(this.p));
    return babyJub.packPoint(this.p);
  }

  toString(): string {
    return this.compress().toString();
  }

  verifyPoseidon(msg: bigint, sig: Signature): boolean {
    return eddsa.verifyPoseidon(msg, sig, this.p);
  }
}

export class PrivateKey {
  sk: Uint8Array;

  constructor(buf: Uint8Array) {
    if (buf.length !== 32) {
      throw new Error('buf must be 32 bytes');
    }
    this.sk = buf;
  }

  toString(): string {
    return this.sk.toString();
  }

  public(): PublicKey {
    return new PublicKey(eddsa.prv2pub(this.sk));
  }

  // toPrivScalar(): bigint {
  //   const h1 = createBlakeHash('blake512').update(this.sk).digest();
  //   const sBuff = eddsa.pruneBuffer(h1.slice(0, 32));
  //   let s = Scalar.fromRprLE(sBuff, 0, 32);
  //   return s;
  //   // return (bigint.leBuff2int(sBuff)).shr(3);
  // }

  signPoseidon(msg: bigint): Signature {
    const s = eddsa.signPoseidon(this.sk, msg);
    return new Signature(s.R8, s.S);
  }
}
