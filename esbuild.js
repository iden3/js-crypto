/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const esbuild = require('esbuild');
const plugin = require('node-stdlib-browser/helpers/esbuild/plugin');
let stdLibBrowser = require('node-stdlib-browser');
const path = require('path');

stdLibBrowser = {
  ...stdLibBrowser,
  ffjavascript: path.join(__dirname, 'scripts/ffjavascript.js')
};

const commonConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  plugins: [plugin(stdLibBrowser)],
  define: {
    global: 'global',
    process: 'process',
    Buffer: 'Buffer'
  },
  inject: [require.resolve('node-stdlib-browser/helpers/esbuild/shim')]
};

console.log('START building ESM bundle...');
esbuild.build({
  ...commonConfig,
  outfile: 'dist/esm/index.js',
  format: 'esm'
});
console.log('END building ESM bundle...');

console.log('START building umd bundle...');
esbuild.build({
  ...commonConfig,
  outfile: 'dist/umd/index.js',
  format: 'iife',
  globalName: 'IdenJsCrypto'
});
console.log('END building umd bundle...');
