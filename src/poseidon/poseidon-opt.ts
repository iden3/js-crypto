import { F1Field, Scalar, utils } from '../ff';
import op from './poseidon-constants-opt.json';

export const OPT = utils.unStringifyBigInts(op) as {
  C: bigint[][];
  S: bigint[][];
  M: bigint[][][];
  P: bigint[][][];
};

const N_ROUNDS_F = 8;
const N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68];
const SPONGE_INPUTS = 16;
const SPONGE_CHUNK_SIZE = 31;

const F = new F1Field(
  Scalar.fromString('21888242871839275222246405745257275088548364400416034343698204186575808495617')
);
const pow5 = (a: bigint): bigint => F.mul(a, F.square(F.square(a)));

// circomlibjs Poseidon bn128
export class Poseidon {
  static F = F;

  static hash(inputs: bigint[]): bigint {
    if (!(inputs.length > 0 && inputs.length <= N_ROUNDS_P.length)) {
      throw new Error('Invalid inputs');
    }

    if (inputs.some((i) => i < 0 || i >= F.p)) {
      throw new Error(`One or more inputs are not in the field: ${F.p}`);
    }

    const t = inputs.length + 1;
    const nRoundsF = N_ROUNDS_F;
    const nRoundsP = N_ROUNDS_P[t - 2];
    const C = OPT.C[t - 2];
    const S = OPT.S[t - 2];
    const M = OPT.M[t - 2];
    const P = OPT.P[t - 2];

    let state: bigint[] = [F.zero, ...inputs.map((a) => F.e(a) as bigint)];

    state = state.map((a, i) => F.add(a, C[i]));

    for (let r = 0; r < nRoundsF / 2 - 1; r++) {
      state = state.map((a) => pow5(a));
      state = state.map((a, i) => F.add(a, C[(r + 1) * t + i]));
      state = state.map((_, i) =>
        state.reduce((acc, a, j) => F.add(acc, F.mul(M[j][i], a)), F.zero)
      );
    }
    state = state.map((a) => pow5(a));
    state = state.map((a, i) => F.add(a, C[(nRoundsF / 2 - 1 + 1) * t + i]));
    state = state.map((_, i) => state.reduce((acc, a, j) => F.add(acc, F.mul(P[j][i], a)), F.zero));
    for (let r = 0; r < nRoundsP; r++) {
      state[0] = pow5(state[0]);
      state[0] = F.add(state[0], C[(nRoundsF / 2 + 1) * t + r]);

      const s0 = state.reduce((acc, a, j) => {
        return F.add(acc, F.mul(S[(t * 2 - 1) * r + j], a));
      }, F.zero);
      for (let k = 1; k < t; k++) {
        state[k] = F.add(state[k], F.mul(state[0], S[(t * 2 - 1) * r + t + k - 1]));
      }
      state[0] = s0;
    }
    for (let r = 0; r < nRoundsF / 2 - 1; r++) {
      state = state.map((a) => pow5(a));
      state = state.map((a, i) => F.add(a, C[(nRoundsF / 2 + 1) * t + nRoundsP + r * t + i]));
      state = state.map((_, i) =>
        state.reduce((acc, a, j) => F.add(acc, F.mul(M[j][i], a)), F.zero)
      );
    }
    state = state.map((a) => pow5(a));
    state = state.map((_, i) => state.reduce((acc, a, j) => F.add(acc, F.mul(M[j][i], a)), F.zero));

    return F.normalize(state[0]);
  }

  // HashBytes returns a sponge hash of a msg byte slice split into blocks of 31 bytes
  static hashBytes(msg: Uint8Array): bigint {
    return Poseidon.hashBytesX(msg, SPONGE_INPUTS);
  }

  // hashBytesX returns a sponge hash of a msg byte slice split into blocks of 31 bytes
  static hashBytesX(msg: Uint8Array, frameSize: number): bigint {
    const inputs = new Array(frameSize).fill(BigInt(0));
    let dirty = false;
    let hash!: bigint;

    let k = 0;
    for (let i = 0; i < parseInt(`${msg.length / SPONGE_CHUNK_SIZE}`); i += 1) {
      dirty = true;
      inputs[k] = utils.beBuff2int(msg.slice(SPONGE_CHUNK_SIZE * i, SPONGE_CHUNK_SIZE * (i + 1)));
      if (k === frameSize - 1) {
        hash = Poseidon.hash(inputs);
        dirty = false;
        inputs[0] = hash;
        inputs.fill(BigInt(0), 1, SPONGE_CHUNK_SIZE);
        for (let j = 1; j < frameSize; j += 1) {
          inputs[j] = BigInt(0);
        }
        k = 1;
      } else {
        k += 1;
      }
    }

    if (msg.length % SPONGE_CHUNK_SIZE != 0) {
      const buff = new Uint8Array(SPONGE_CHUNK_SIZE);
      const slice = msg.slice(parseInt(`${msg.length / SPONGE_CHUNK_SIZE}`) * SPONGE_CHUNK_SIZE);
      slice.forEach((v, idx) => {
        buff[idx] = v;
      });
      inputs[k] = utils.beBuff2int(buff);
      dirty = true;
    }

    if (dirty) {
      // we haven't hashed something in the main sponge loop and need to do hash here
      hash = Poseidon.hash(inputs);
    }

    return hash;
  }

  // SpongeHashX returns a sponge hash of inputs using Poseidon with configurable frame size
  static spongeHashX(inputs: bigint[], frameSize: number): bigint {
    if (frameSize < 2 || frameSize > 16) {
      throw new Error('incorrect frame size');
    }

    // not used frame default to zero
    let frame = new Array(frameSize).fill(BigInt(0));

    let dirty = false;
    let hash!: bigint;

    let k = 0;
    for (let i = 0; i < inputs.length; i++) {
      dirty = true;
      frame[k] = inputs[i];
      if (k === frameSize - 1) {
        hash = this.hash(frame);
        dirty = false;
        frame = new Array(frameSize).fill(BigInt(0));
        frame[0] = hash;
        k = 1;
      } else {
        k++;
      }
    }

    if (dirty) {
      // we haven't hashed something in the main sponge loop and need to do hash here
      hash = this.hash(frame);
    }

    if (!hash) {
      throw new Error('hash is undefined');
    }

    return hash;
  }
}
export const poseidon = Poseidon;
