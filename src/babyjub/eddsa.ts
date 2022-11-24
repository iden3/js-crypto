// @ts-ignore
import createBlakeHash from 'blake-hash';
import { Hex } from '../hex';
import { babyJub, BabyJub } from './babyjub';
import { poseidon, Poseidon } from '../poseidon';
import { F1Field, Scalar, utils } from '../ff';
import { PublicKey, Signature } from './eddsa-keys';

export class Eddsa {
  babyJub: BabyJub;
  poseidon: Poseidon;
  F: {};

  constructor(babyJub: BabyJub, poseidon: Poseidon) {
    this.babyJub = babyJub;
    this.poseidon = poseidon;
    this.F = babyJub.F;
  }

  pruneBuffer(buff: Uint8Array) {
    buff[0] = buff[0] & 0xf8;
    buff[31] = buff[31] & 0x7f;
    buff[31] = buff[31] | 0x40;
    return buff;
  }

  prv2pub(prv: Uint8Array): [bigint, bigint] {
    const F = this.babyJub.F;
    const privHex = Hex.encodeString(prv);
    const sBuff = this.pruneBuffer(createBlakeHash('blake512').update(privHex, 'hex').digest());

    const s = Scalar.fromRprLE(sBuff, 0, 32);
    const A = this.babyJub.mulPointEscalar(this.babyJub.Base8, Scalar.shr(s, 3));
    return A;
  }

  signPoseidon(prv: Uint8Array, msg: bigint) {
    const privateHex = Hex.encodeString(prv);
    const h1 = createBlakeHash('blake512').update(privateHex, 'hex').digest();

    const sBuff = this.pruneBuffer(h1.slice(0, 32));
    const s = utils.leBuff2int(sBuff);
    const A = babyJub.mulPointEscalar(babyJub.Base8, Scalar.shr(s, 3));

    const msgBuff = utils.leInt2Buff(msg, 32);

    const composeBuff = new Uint8Array(64);
    composeBuff.set(h1.slice(32, 64), 0);
    composeBuff.set(msgBuff, 32);

    const rBuff = createBlakeHash('blake512').update(Hex.encodeString(composeBuff), 'hex').digest();
    let r = utils.leBuff2int(rBuff);
    const Fr = new F1Field(babyJub.subOrder);
    r = Fr.e(r);
    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r);
    const hm = this.poseidon.hash([R8[0], R8[1], A[0], A[1], msg]);
    const S = Fr.add(r, Fr.mul(hm, s));
    return {
      R8: R8,
      S: S
    };
  }

  verifyPoseidon(msg: bigint, sig: Signature, A: PublicKey['p']): boolean {
    // Check parameters
    if (typeof sig != 'object') return false;
    if (!Array.isArray(sig.R8)) return false;
    if (sig.R8.length != 2) return false;
    if (!this.babyJub.inCurve(sig.R8)) return false;
    if (!Array.isArray(A)) return false;
    if (A.length != 2) return false;
    if (!this.babyJub.inCurve(A)) return false;
    if (sig.S >= this.babyJub.subOrder) return false;

    const hm = this.poseidon.hash([sig.R8[0], sig.R8[1], A[0], A[1], msg]);
    const hms = Scalar.e(this.babyJub.F.toObject(hm));

    const Pleft = this.babyJub.mulPointEscalar(this.babyJub.Base8, sig.S);
    let Pright = this.babyJub.mulPointEscalar(A, Scalar.mul(hms, 8));
    Pright = this.babyJub.addPoint(sig.R8, Pright);

    if (!this.babyJub.F.eq(Pleft[0], Pright[0])) return false;
    if (!this.babyJub.F.eq(Pleft[1], Pright[1])) return false;
    return true;
  }

  packSignature(sig: Signature): Uint8Array {
    const buff = new Uint8Array(64);
    const R8p = this.babyJub.packPoint(sig.R8);
    buff.set(R8p, 0);
    const Sp = Scalar.toRprLE(buff, 32, sig.S, 32);
    return buff;
  }

  unpackSignature(sigBuff: Uint8Array) {
    return {
      R8: this.babyJub.unpackPoint(sigBuff.slice(0, 32)),
      S: Scalar.fromRprLE(sigBuff, 32, 32)
    };
  }
}

export const eddsa = new Eddsa(babyJub, poseidon);
