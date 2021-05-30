module.exports = {
  'env': {
    'browser': false,
    'es2021': true,
    'node': true,
  },
  'plugins': ['mocha'],
  'extends': [
    'eslint:recommended',
    'google',
    'plugin:mocha/recommended'
  ],
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'rules': {
    'indent': 'off',
    'require-jsdoc': 'off',
    'max-len': 'off',
    'no-unused-vars': 'warn',
  },
};
