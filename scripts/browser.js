const esbuild = require('esbuild');
const process = require('process');

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

esbuild
  .build({
    ...baseConfig
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...baseConfig,
    format: 'iife',
    outfile: 'dist/browser/umd/index.js',
    globalName
  })
  .catch(() => process.exit(1));
