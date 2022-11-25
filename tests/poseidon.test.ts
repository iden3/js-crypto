import { poseidon } from '../src';

describe('Poseidon test', () => {
  
  it('test 2 inputs', () => {
    const inputs = [1, 2].map((v) => BigInt(v));
    const res = poseidon.hash(inputs);
    expect(res.toString(16)).toEqual('115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a')
  });
  
  it("test 4 inputs", async () => {
    const inputs = [1, 2, 3, 4].map((v) => BigInt(v));
    const res2 = poseidon.hash(inputs);
    expect('299c867db6c1fdd79dcefa40e4510b9837e60ebb1ce0663dbaa525df65250465').toEqual(res2.toString(16));
  });
  
  it("invalid inputs", async () => {
    const inputs = new Array(17).fill(1).map((v) => BigInt(v));
    expect(() => poseidon.hash(inputs)).toThrow(new Error('Invalid inputs'));
  });
});
