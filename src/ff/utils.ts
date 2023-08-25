import * as Scalar from './scalar';

export function unstringifyBigInts(o: unknown): unknown {
  if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  } else if (typeof o == 'object') {
    const res: { [k: string]: unknown } = {};
    for (const [key, val] of Object.entries(o as unknown as { [k: string]: unknown })) {
      res[key] = unstringifyBigInts(val);
    }
    return res;
  }
  // base64 decode
  const byteArray = Uint8Array.from(atob(o as string), (c) => c.charCodeAt(0));
  const hex = [...byteArray].map((x) => x.toString(16).padStart(2, '0')).join('');
  return BigInt(`0x${hex}`);
}

export function beBuff2int(buff: Uint8Array) {
  let res = BigInt(0);
  let i = buff.length;
  let offset = 0;
  const buffV = new DataView(buff.buffer, buff.byteOffset, buff.byteLength);
  while (i > 0) {
    if (i >= 4) {
      i -= 4;
      res += BigInt(buffV.getUint32(i)) << BigInt(offset * 8);
      offset += 4;
    } else if (i >= 2) {
      i -= 2;
      res += BigInt(buffV.getUint16(i)) << BigInt(offset * 8);
      offset += 2;
    } else {
      i -= 1;
      res += BigInt(buffV.getUint8(i)) << BigInt(offset * 8);
      offset += 1;
    }
  }
  return res;
}

export function beInt2Buff(n: bigint, len: number) {
  let r = n;
  const buff = new Uint8Array(len);
  const buffV = new DataView(buff.buffer);
  let o = len;
  while (o > 0) {
    if (o - 4 >= 0) {
      o -= 4;
      buffV.setUint32(o, Number(r & BigInt(0xffffffff)));
      r = r >> BigInt(32);
    } else if (o - 2 >= 0) {
      o -= 2;
      buffV.setUint16(o, Number(r & BigInt(0xffff)));
      r = r >> BigInt(16);
    } else {
      o -= 1;
      buffV.setUint8(o, Number(r & BigInt(0xff)));
      r = r >> BigInt(8);
    }
  }
  if (r) {
    throw new Error('Number does not fit in this length');
  }
  return buff;
}

export function leBuff2int(buff: Uint8Array) {
  let res = BigInt(0);
  let i = 0;
  const buffV = new DataView(buff.buffer, buff.byteOffset, buff.byteLength);
  while (i < buff.length) {
    if (i + 4 <= buff.length) {
      res += BigInt(buffV.getUint32(i, true)) << BigInt(i * 8);
      i += 4;
    } else if (i + 2 <= buff.length) {
      res += BigInt(buffV.getUint16(i, true)) << BigInt(i * 8);
      i += 2;
    } else {
      res += BigInt(buffV.getUint8(i)) << BigInt(i * 8);
      i += 1;
    }
  }
  return res;
}

export function leInt2Buff(n: bigint, len: number) {
  let r = n;
  if (typeof len === 'undefined') {
    len = Math.floor((Scalar.bitLength(n) - 1) / 8) + 1;
    if (len == 0) len = 1;
  }
  const buff = new Uint8Array(len);
  const buffV = new DataView(buff.buffer);
  let o = 0;
  while (o < len) {
    if (o + 4 <= len) {
      buffV.setUint32(o, Number(r & BigInt(0xffffffff)), true);
      o += 4;
      r = r >> BigInt(32);
    } else if (o + 2 <= len) {
      buffV.setUint16(o, Number(r & BigInt(0xffff)), true);
      o += 2;
      r = r >> BigInt(16);
    } else {
      buffV.setUint8(o, Number(r & BigInt(0xff)));
      o += 1;
      r = r >> BigInt(8);
    }
  }
  if (r) {
    throw new Error('Number does not fit in this length');
  }
  return buff;
}
