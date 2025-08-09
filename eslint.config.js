import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    name: 'custom/ignores',
    ignores: ['dist/**'],
  },
  {
    name: 'eslint/recommended',
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended,
  {
    name: 'custom/rules',
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      // カスタムルールがあれば追加
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Stylistic rules
      '@stylistic/semi': 'error',
      '@stylistic/semi-spacing': 'error',
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/comma-spacing': 'error',
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/block-spacing': 'error',
      '@stylistic/indent': ['error', 2],
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/space-in-parens': 'error',
      '@stylistic/keyword-spacing': 'error',
      '@stylistic/object-curly-spacing': ['error', 'always',  { objectsInObjects: false }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/quote-props': ['error', 'consistent-as-needed'],
      '@stylistic/function-call-spacing': ['error', 'never'],
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      }],
      '@stylistic/no-multiple-empty-lines': ['error', {
        max: 1,
        maxEOF: 0,
        maxBOF: 0,
      }],
      '@stylistic/object-property-newline': ['error', {
        allowAllPropertiesOnSameLine: true,
      }],
      '@stylistic/array-element-newline': ['error', 'consistent'],
    },
  },
  {
    name: 'custom/rules for test',
    files: ['**/*.test.{js,ts}'],
    rules: {
      // テストファイル用のルール調整
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
