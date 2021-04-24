module.exports = {
  'env': {
    'browser': false,
    'es2021': true,
  },
  'plugins': ['security'],
  'extends': [
    'google',
    'plugin:security/recommended',
  ],
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'rules': {
    'indent': 'off',
    'require-jsdoc': 'off',
    'max-len': 'off',
  },
};
