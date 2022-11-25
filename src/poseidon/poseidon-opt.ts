import { F1Field, Scalar, utils } from '../ff';
import op from './poseidon-constants-opt.json';

const N_ROUNDS_F = 8;
const N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68];

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
}
export const poseidon = new Poseidon();
