import { Scalar, F1Field } from '../ff';

// circomlibjs BabyJub
export class BabyJub {
  F;
  p: bigint;
  pm1d2: bigint;
  Generator: bigint[];
  Base8: bigint[];
  order: bigint;
  subOrder: bigint;
  A: bigint;
  D: bigint;

  constructor(F: F1Field) {
    this.F = F;
    this.p = BigInt(
      '21888242871839275222246405745257275088548364400416034343698204186575808495617'
    );
    this.pm1d2 = Scalar.div(Scalar.sub(this.p, Scalar.one), 2n);

    this.Generator = [
      F.e('995203441582195749578291179787384436505546430278305826713579947235728471134'),
      F.e('5472060717959818805561601436314318772137091100104008585924551046643952123905')
    ];
    this.Base8 = [
      F.e('5299619240641551281634865583518297030282874472190772894086521144482721001553'),
      F.e('16950150798460657717958625567821834550301663161624707787222815936182638968203')
    ];
    this.order = BigInt(
      '21888242871839275222246405745257275088614511777268538073601725287587578984328'
    );
    this.subOrder = Scalar.shiftRight(this.order, 3n);
    this.A = F.e('168700');
    this.D = F.e('168696');
  }

  addPoint(a: bigint[], b: bigint[]): [bigint, bigint] {
    const F = this.F;

    const res = new Array(2);

    /* does the equivalent of:
    res[0] = bigInt((a[0]*b[1] + b[0]*a[1]) *  bigInt(bigInt("1") + d*a[0]*b[0]*a[1]*b[1]).inverse(q)).affine(q);
    res[1] = bigInt((a[1]*b[1] - cta*a[0]*b[0]) * bigInt(bigInt("1") - d*a[0]*b[0]*a[1]*b[1]).inverse(q)).affine(q);
    */

    const beta = F.mul(a[0], b[1]);
    const gamma = F.mul(a[1], b[0]);
    const delta = F.mul(F.sub(a[1], F.mul(this.A, a[0])), F.add(b[0], b[1]));
    const tau = F.mul(beta, gamma);
    const dTau = F.mul(this.D, tau);

    res[0] = F.div(F.add(beta, gamma), F.add(F.one, dTau));

    res[1] = F.div(F.add(delta, F.sub(F.mul(this.A, beta), gamma)), F.sub(F.one, dTau));

    return res as [bigint, bigint];
  }

  mulPointEScalar(base: bigint[], e: bigint): [bigint, bigint] {
    const F = this.F;
    let res: [bigint, bigint] = [F.e('0'), F.e('1')];
    let rem = e;
    let exp = base;

    while (!Scalar.isZero(rem)) {
      if (Scalar.isOdd(rem)) {
        res = this.addPoint(res, exp);
      }
      exp = this.addPoint(exp, exp);
      rem = Scalar.shiftRight(rem, Scalar.one);
    }

    return res;
  }

  inSubgroup(P: bigint[]): boolean {
    const F = this.F;
    if (!this.inCurve(P)) return false;
    const res = this.mulPointEScalar(P, this.subOrder);
    return F.isZero(res[0]) && F.eq(res[1], F.one);
  }

  inCurve(P: bigint[]): boolean {
    const F = this.F;
    const x2 = F.square(P[0]);
    const y2 = F.square(P[1]);

    if (!F.eq(F.add(F.mul(this.A, x2), y2), F.add(F.one, F.mul(F.mul(x2, y2), this.D))))
      return false;

    return true;
  }

  packPoint(P: bigint[]): Uint8Array {
    const F = this.F;
    const buff = new Uint8Array(32);
    F.toRprLE(buff, 0, P[1]);
    const n = F.toObject(P[0]);
    if (Scalar.gt(n, this.pm1d2)) {
      buff[31] = buff[31] | 0x80;
    }
    return buff;
  }

  unpackPoint(buff: Uint8Array): [bigint, bigint] | null {
    const F = this.F;
    let sign = false;
    const P: [bigint, bigint] = [BigInt(0), BigInt(0)];
    if (buff[31] & 0x80) {
      sign = true;
      buff[31] = buff[31] & 0x7f;
    }
    P[1] = F.fromRprLE(buff, 0);
    if (Scalar.gt(F.toObject(P[1]), this.p)) return null;

    const y2 = F.square(P[1]);

    const x2 = F.div(F.sub(F.one, y2), F.sub(this.A, F.mul(this.D, y2)));

    const x2h = F.exp(x2, BigInt(F.half));
    if (!F.eq(F.one, x2h)) return null;

    let x = F.sqrt(x2);

    if (x == null) return null;

    if (sign) x = F.neg(x);

    P[0] = BigInt(x);

    return P;
  }
}
const F = new F1Field(
  BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617')
);

export const babyJub = new BabyJub(F);
