const iden3Config = require('@iden3/eslint-config');
const { spellcheckerRule, cspellConfig } = require('@iden3/eslint-config/cspell');

module.exports = {
  ...iden3Config,
  rules: {
    '@cspell/spellchecker': [
      1,
      {
        ...spellcheckerRule,
        cspell: {
          ...cspellConfig,
          ignoreWords: [
            'dtau',
            'escalar',
            'pleft',
            'pright',
            'unstringify',
            'bxor',
            'nullt',
            'msglen',
            'negone',
            'tonelli',
            'nres',
            'idiv',
            'newr',
            'bnot'
          ]
        }
      }
    ]
  }
};
