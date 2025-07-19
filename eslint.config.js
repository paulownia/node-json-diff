import js from '@eslint/js';
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
    rules: {
      // カスタムルールがあれば追加
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    name: 'custom/rules for test',
    files: ['**/*.test.{js,ts}'],
    rules: {
      // テストファイル用のルール調整
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
