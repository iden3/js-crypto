import { build } from 'esbuild';
import { exit } from 'process';

const globalName = 'IdenJsCrypto';
const baseConfig = {
  dropLabels: ['NODE'],
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'browser',
  target: 'es2020',
  outfile: 'dist/browser/esm/index.js',
  format: 'esm'
};

build({
  ...baseConfig
}).catch(() => exit(1));

build({
  ...baseConfig,
  format: 'iife',
  outfile: 'dist/browser/umd/index.js',
  globalName
}).catch(() => exit(1));
