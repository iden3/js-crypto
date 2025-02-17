import { babyJub, BabyJub } from './babyjub';
import { poseidon } from '../poseidon';
import { F1Field, Scalar, utils } from '../ff';
import { PublicKey, Signature } from './eddsa-keys';
import { blake512 } from '@noble/hashes/blake1';

export class Eddsa {
  babyJub: BabyJub = babyJub;

  static pruneBuffer(buff: Uint8Array) {
    buff[0] = buff[0] & 0xf8;
    buff[31] = buff[31] & 0x7f;
    buff[31] = buff[31] | 0x40;
    return buff;
  }

  static prv2pub(prv: Uint8Array): [bigint, bigint] {
    const sBuff = this.pruneBuffer(blake512(prv));
    const s = Scalar.fromRprLE(sBuff, 0, 32);
    const A = babyJub.mulPointEScalar(babyJub.Base8, Scalar.shr(s, 3n));
    return A;
  }

  static signPoseidon(prv: Uint8Array, msg: bigint) {
    const h1 = blake512(prv);
    const sBuff = Eddsa.pruneBuffer(h1.slice(0, 32));
    const s = utils.leBuff2int(sBuff);
    const A = babyJub.mulPointEScalar(babyJub.Base8, Scalar.shr(s, 3n));

    const msgBuff = utils.leInt2Buff(msg, 32);

    const composeBuff = new Uint8Array(64);
    composeBuff.set(h1.slice(32, 64), 0);
    composeBuff.set(msgBuff, 32);

    const rBuff = blake512(composeBuff);
    let r = utils.leBuff2int(rBuff);
    const Fr = new F1Field(babyJub.subOrder);
    r = Fr.e(r) as bigint;
    const R8 = babyJub.mulPointEScalar(babyJub.Base8, r);
    const hm = poseidon.hash([R8[0], R8[1], A[0], A[1], msg]);
    const S = Fr.add(r, Fr.mul(hm, s));
    return {
      R8: R8,
      S: S
    };
  }

  static verifyPoseidon(msg: bigint, sig: Signature, A: PublicKey['p']): boolean {
    // Check parameters
    if (typeof sig != 'object') return false;
    if (!Array.isArray(sig.R8)) return false;
    if (sig.R8.length != 2) return false;
    if (!babyJub.inCurve(sig.R8)) return false;
    if (!Array.isArray(A)) return false;
    if (A.length != 2) return false;
    if (!babyJub.inCurve(A)) return false;
    if (sig.S >= babyJub.subOrder) return false;

    const hm = poseidon.hash([sig.R8[0], sig.R8[1], A[0], A[1], msg]);
    const hms = hm;

    const pLeft = babyJub.mulPointEScalar(babyJub.Base8, sig.S);
    let pRight = babyJub.mulPointEScalar(A, Scalar.mul(hms, 8n));
    pRight = babyJub.addPoint(sig.R8, pRight);

    if (!babyJub.F.eq(pLeft[0], pRight[0])) return false;
    if (!babyJub.F.eq(pLeft[1], pRight[1])) return false;
    return true;
  }

  static packSignature(sig: Signature): Uint8Array {
    const buff = new Uint8Array(64);
    const R8p = babyJub.packPoint(sig.R8);
    buff.set(R8p, 0);
    Scalar.toRprLE(buff, 32, sig.S, 32);
    return buff;
  }

  static unpackSignature(sigBuff: Uint8Array) {
    return {
      R8: babyJub.unpackPoint(sigBuff.slice(0, 32)),
      S: Scalar.fromRprLE(sigBuff, 32, 32)
    };
  }
}

export const eddsa = Eddsa;
