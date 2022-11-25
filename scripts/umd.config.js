const esbuild = require('esbuild');
const baseConfig = require('./base.config');
const pkg = require('../package.json');

const name = 'IdenJsCrypto';

esbuild.build({
  ...baseConfig,
  minify: true,
  format: 'iife',
  outfile: pkg.main,
  globalName: name

}).catch(() => process.exit(1));
