import { F1Field, Scalar, utils } from '../ff';
import op from './poseidon-constants-opt.json';

const N_ROUNDS_F = 8;
const N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68];
const SPONGE_INPUTS = 16;
const SPONGE_CHUNK_SIZE = 31;

const F = new F1Field(
  Scalar.fromString('21888242871839275222246405745257275088548364400416034343698204186575808495617')
);
const pow5 = (a: bigint): bigint => F.mul(a, F.square(F.square(a, a)));

const opt = utils.unstringifyBigInts(op);

// circomlibjs Poseidon bn128
export class Poseidon {
  F = F;
  hash(inputs: bigint[]): bigint {
    if (!(inputs.length > 0 && inputs.length <= N_ROUNDS_P.length)) {
      throw new Error('Invalid inputs');
    }

    const t = inputs.length + 1;
    const nRoundsF = N_ROUNDS_F;
    const nRoundsP = N_ROUNDS_P[t - 2];
    const C = opt.C[t - 2];
    const S = opt.S[t - 2];
    const M = opt.M[t - 2];
    const P = opt.P[t - 2];

    let state: bigint[] = [F.zero, ...inputs.map((a) => F.e(a))];

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

  hashBytes(msg: Uint8Array): bigint {
    let inputs: Array<bigint> = [];
    for (let i = 0; i < SPONGE_INPUTS; i += 1) {
      inputs.push(BigInt(0));
    }
    let dirty = false;
    let hash: bigint;

    let k = 0;
    for (let i = 0; i < parseInt(`${msg.length / SPONGE_CHUNK_SIZE}`); i += 1) {
      dirty = true;
      inputs[k] = utils.beBuff2int(msg.slice(SPONGE_CHUNK_SIZE * i, SPONGE_CHUNK_SIZE * (i + 1)));
      if (k === SPONGE_INPUTS - 1) {
        hash = this.hash(inputs);
        dirty = false;
        inputs = [];
        inputs[0] = hash.valueOf();
        for (let j = 1; j < SPONGE_INPUTS; j += 1) {
          inputs[j] = BigInt(0);
        }
        k = 1;
      } else {
        k += 1;
      }
    }

    if (msg.length % SPONGE_CHUNK_SIZE != 0) {
      const buff = new Uint8Array(new ArrayBuffer(SPONGE_CHUNK_SIZE));
      const slice = msg.slice(parseInt(`${msg.length / SPONGE_CHUNK_SIZE}`) * SPONGE_CHUNK_SIZE);
      slice.forEach((v, idx) => {
        buff[idx] = v;
      });
      inputs[k] = utils.beBuff2int(buff);
      dirty = true;
    }

    if (dirty) {
      // we haven't hashed something in the main sponge loop and need to do hash here
      hash = this.hash(inputs);
    }

    // @ts-ignore: if we reach here then hash should be assigned value
    return hash.valueOf();
  }
}
export const poseidon = new Poseidon();
