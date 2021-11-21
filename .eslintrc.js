module.exports = {
  root: true,
  env: {
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/no-shadow': ['error'],
    'class-methods-use-this': 'off',
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['import/**'],
    }],
    'max-len': ['error', {
      code: 120,
    }],
    'no-shadow': 'off',
    'no-continue': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': [
      'off',
      {
        selector: 'ForOfStatement',
      },
    ],
    'semi-style': 'off',
  },
};
