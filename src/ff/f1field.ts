import * as Scalar from './scalar';
import { getRandomBytes } from './random';

export class F1Field {
  type: string;
  one: bigint;
  zero: bigint;
  p: bigint;
  m: bigint;
  negOne: bigint;
  two: bigint;
  half: bigint;
  bitLength: number;
  mask: bigint;
  n64: number;
  n32: number;
  n8: number;
  R: bigint;
  s: number;
  shift: bigint;
  Ri: bigint;
  nqr: bigint;
  t: bigint;
  nqr_to_t: bigint;
  k: bigint;

  constructor(p: bigint) {
    this.type = 'F1';
    this.one = BigInt(1);
    this.zero = BigInt(0);
    this.p = BigInt(p);
    this.m = Scalar.one;
    this.negOne = this.p - this.one;
    this.two = BigInt(2);
    this.half = this.p >> this.one;
    this.bitLength = Scalar.bitLength(this.p);
    this.mask = (this.one << BigInt(this.bitLength)) - this.one;

    this.n64 = Math.floor((this.bitLength - 1) / 64) + 1;
    this.n32 = this.n64 * 2;
    this.n8 = this.n64 * 8;
    this.R = this.e(this.one << BigInt(this.n64 * 64));
    this.Ri = this.inv(this.R);

    const e = this.negOne >> this.one;
    this.nqr = this.two;
    let r = this.pow(this.nqr, e);
    while (!this.eq(r, this.negOne)) {
      this.nqr = this.nqr + this.one;
      r = this.pow(this.nqr, e);
    }

    this.s = 0;
    this.t = this.negOne;

    while ((this.t & this.one) == this.zero) {
      this.s = this.s + 1;
      this.t = this.t >> this.one;
    }

    this.nqr_to_t = this.pow(this.nqr, this.t);

    // eslint-disable-next-line @cspell/spellchecker
    tonelliShanks(this);

    this.shift = this.square(this.nqr);
    this.k = this.exp(this.nqr, BigInt(2 ** this.s));
  }

  e(a: string | bigint, b: bigint | undefined = undefined): bigint {
    let res!: bigint;
    if (!b) {
      res = BigInt(a);
    } else if (b == BigInt(16)) {
      res = BigInt('0x' + a);
    }
    if (res < 0) {
      let nRes = -res;
      if (nRes >= this.p) nRes = nRes % this.p;
      return this.p - nRes;
    } else {
      return res >= this.p ? res % this.p : res;
    }
  }

  add(a: bigint, b: bigint): bigint {
    const res = a + b;
    return res >= this.p ? res - this.p : res;
  }

  sub(a: bigint, b: bigint): bigint {
    return a >= b ? a - b : this.p - b + a;
  }

  neg(a: bigint): bigint {
    return a ? this.p - a : a;
  }

  double(a: bigint): bigint {
    return this.add(a, a);
  }

  mul(a: bigint, b: bigint): bigint {
    return (a * b) % this.p;
  }

  mulScalar(base: bigint, s: bigint) {
    return (base * this.e(s)) % this.p;
  }

  square(a: bigint): bigint {
    return (a * a) % this.p;
  }

  eq(a: bigint, b: bigint): boolean {
    return a == b;
  }

  neq(a: bigint, b: bigint): boolean {
    return a != b;
  }

  lt(a: bigint, b: bigint): boolean {
    const aa = a > this.half ? a - this.p : a;
    const bb = b > this.half ? b - this.p : b;
    return aa < bb;
  }

  gt(a: bigint, b: bigint): boolean {
    const aa = a > this.half ? a - this.p : a;
    const bb = b > this.half ? b - this.p : b;
    return aa > bb;
  }

  leq(a: bigint, b: bigint): boolean {
    const aa = a > this.half ? a - this.p : a;
    const bb = b > this.half ? b - this.p : b;
    return aa <= bb;
  }

  geq(a: bigint, b: bigint): boolean {
    const aa = a > this.half ? a - this.p : a;
    const bb = b > this.half ? b - this.p : b;
    return aa >= bb;
  }

  div(a: bigint, b: bigint): bigint {
    return this.mul(a, this.inv(b));
  }

  iDiv(a: bigint, b: bigint): bigint {
    if (!b) throw new Error('Division by zero');
    return a / b;
  }

  inv(a: bigint) {
    if (!a) throw new Error('Division by zero');

    let t = this.zero;
    let r = this.p;
    let newt = this.one;
    let newR = a % this.p;
    while (newR) {
      const q = r / newR;
      [t, newt] = [newt, t - q * newt];
      [r, newR] = [newR, r - q * newR];
    }
    if (t < this.zero) t += this.p;
    return t;
  }

  mod(a: bigint, b: bigint): bigint {
    return a % b;
  }

  pow(b: bigint, e: bigint): bigint {
    return exp(this, b, e);
  }

  exp(b: bigint, e: bigint): bigint {
    return exp(this, b, BigInt(e));
  }

  band(a: bigint, b: bigint): bigint {
    const res = a & b & this.mask;
    return res >= this.p ? res - this.p : res;
  }

  bor(a: bigint, b: bigint): bigint {
    const res = (a | b) & this.mask;
    return res >= this.p ? res - this.p : res;
  }

  bXor(a: bigint, b: bigint): bigint {
    const res = (a ^ b) & this.mask;
    return res >= this.p ? res - this.p : res;
  }

  bNot(a: bigint): bigint {
    const res = a ^ this.mask;
    return res >= this.p ? res - this.p : res;
  }

  shl(a: bigint, b: bigint): bigint {
    if (Number(b) < this.bitLength) {
      const res = (a << b) & this.mask;
      return res >= this.p ? res - this.p : res;
    } else {
      const nb = this.p - b;
      if (Number(nb) < this.bitLength) {
        return a >> nb;
      } else {
        return this.zero;
      }
    }
  }

  shr(a: bigint, b: bigint): bigint {
    if (Number(b) < this.bitLength) {
      return a >> b;
    } else {
      const nb = this.p - b;
      if (Number(nb) < this.bitLength) {
        const res = (a << nb) & this.mask;
        return res >= this.p ? res - this.p : res;
      } else {
        return Scalar.zero;
      }
    }
  }

  land(a: bigint, b: bigint): bigint {
    return a && b ? this.one : this.zero;
  }

  lor(a: bigint, b: bigint): bigint {
    return a || b ? this.one : this.zero;
  }

  sqrt_old(n: bigint): bigint | null {
    if (n == this.zero) return this.zero;

    // Test that have solution
    const res = this.pow(n, this.negOne >> this.one);
    if (res != this.one) return null;

    let m = this.s;
    let c = this.nqr_to_t;
    let t = this.pow(n, this.t);
    let r = this.pow(n, this.add(this.t, this.one) >> this.one);

    while (t != this.one) {
      let sq = this.square(t);
      let i = 1;
      while (sq != this.one) {
        i++;
        sq = this.square(sq);
      }

      // b = c ^ m-i-1
      let b = c;
      for (let j = 0; j < m - i - 1; j++) b = this.square(b);

      m = i;
      c = this.square(b);
      t = this.mul(t, c);
      r = this.mul(r, b);
    }

    if (r > this.p >> this.one) {
      r = this.neg(r);
    }

    return r;
  }

  normalize(a: bigint): bigint {
    if (a < 0) {
      let na = -a;
      if (na >= this.p) na = na % this.p;
      return this.p - na;
    } else {
      return a >= this.p ? a % this.p : a;
    }
  }

  random(): bigint {
    const nBytes = (this.bitLength * 2) / 8;
    let res = this.zero;
    for (let i = 0; i < nBytes; i++) {
      res = (res << BigInt(8)) + BigInt(getRandomBytes(1)[0]);
    }
    return res % this.p;
  }

  toString(a: bigint, base = 10) {
    base = base || 10;
    let vs;
    if (a > this.half && base == 10) {
      const v = this.p - a;
      vs = '-' + v.toString(base);
    } else {
      vs = a.toString(base);
    }
    return vs;
  }

  isZero(a: bigint) {
    return a == this.zero;
  }

  // Returns a buffer with Little Endian Representation
  toRprLE(buff: Uint8Array, o: number, e: bigint) {
    Scalar.toRprLE(buff, o, e, this.n64 * 8);
  }

  // Returns a buffer with Big Endian Representation
  toRprBE(buff: Uint8Array, o: number, e: bigint) {
    Scalar.toRprBE(buff, o, e, this.n64 * 8);
  }

  // Returns a buffer with Big Endian Montgomery Representation
  toRprBEM(buff: Uint8Array, o: number, e: bigint) {
    return this.toRprBE(buff, o, this.mul(this.R, e));
  }

  toRprLEM(buff: Uint8Array, o: number, e: bigint) {
    return this.toRprLE(buff, o, this.mul(this.R, e));
  }

  // Passes a buffer with Little Endian Representation
  fromRprLE(buff: Uint8Array, o: number) {
    return Scalar.fromRprLE(buff, o, this.n8);
  }

  // Passes a buffer with Big Endian Representation
  fromRprBE(buff: Uint8Array, o: number) {
    return Scalar.fromRprBE(buff, o, this.n8);
  }

  fromRprLEM(buff: Uint8Array, o: number) {
    return this.mul(this.fromRprLE(buff, o), this.Ri);
  }

  fromRprBEM(buff: Uint8Array, o: number) {
    return this.mul(this.fromRprBE(buff, o), this.Ri);
  }

  toObject(a: bigint): bigint {
    return a;
  }

  sqrt(a: bigint): bigint | null {
    throw new Error('Not implemented sqrt for F1' + a);
  }

  sqrt_e1!: bigint;
  sqrt_q!: bigint;
  sqrt_s!: bigint;
  sqrt_t!: bigint;
  sqrt_z!: bigint;
  sqrt_tm1d2!: bigint;
}

// eslint-disable-next-line @cspell/spellchecker
function tonelliShanks(F: F1Field) {
  F.sqrt_q = Scalar.pow(F.p, F.m);

  F.sqrt_s = Scalar.zero;
  F.sqrt_t = Scalar.sub(F.sqrt_q, Scalar.one);

  while (!Scalar.isOdd(F.sqrt_t)) {
    F.sqrt_s = F.sqrt_s + Scalar.one;
    F.sqrt_t = Scalar.div(F.sqrt_t, 2n);
  }

  let c0 = F.one;

  while (F.eq(c0, F.one)) {
    const c = F.random();
    F.sqrt_z = F.pow(c, F.sqrt_t);
    c0 = F.pow(F.sqrt_z, 2n ** (F.sqrt_s - Scalar.one));
  }

  F.sqrt_tm1d2 = Scalar.div(Scalar.sub(F.sqrt_t, Scalar.one), 2n);

  F.sqrt = (a: bigint): bigint | null => {
    if (F.isZero(a)) return F.zero;
    let w = F.pow(a, F.sqrt_tm1d2);
    const a0 = F.pow(F.mul(F.square(w), a), 2n ** (F.sqrt_s - Scalar.one));
    if (F.eq(a0, F.negOne)) return null;

    let v = F.sqrt_s;
    let x = F.mul(a, w);
    let b = F.mul(x, w);
    let z = F.sqrt_z;
    while (!F.eq(b, F.one)) {
      let b2k = F.square(b);
      let k = Scalar.one;
      while (!F.eq(b2k, F.one)) {
        b2k = F.square(b2k);
        k++;
      }

      w = z;
      for (let i = 0; i < v - k - Scalar.one; i++) {
        w = F.square(w);
      }
      z = F.square(w);
      b = F.mul(b, z);
      x = F.mul(x, w);
      v = k;
    }
    return F.geq(x, F.zero) ? x : F.neg(x);
  };
}

export function mulScalar(F: F1Field, base: bigint, e: bigint): bigint {
  let res;

  if (Scalar.isZero(e)) return F.zero;

  const n = Scalar.naf(e);

  if (n[n.length - 1] == 1) {
    res = base;
  } else if (n[n.length - 1] == -1) {
    res = F.neg(base);
  } else {
    throw new Error('invalid NAF');
  }

  for (let i = n.length - 2; i >= 0; i--) {
    res = F.double(res);

    if (n[i] == 1) {
      res = F.add(res, base);
    } else if (n[i] == -1) {
      res = F.sub(res, base);
    }
  }

  return res;
}

export function exp(F: F1Field, base: bigint, e: bigint) {
  if (Scalar.isZero(e)) return F.one;

  const n = Scalar.bits(e);

  if (n.length == 0) return F.one;

  let res = base;

  for (let i = n.length - 2; i >= 0; i--) {
    res = F.square(res);

    if (n[i]) {
      res = F.mul(res, base);
    }
  }

  return res;
}
