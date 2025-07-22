// eslint.config.js
const globals = require('globals');
const js = require('@eslint/js');
const jestPlugin = require('eslint-plugin-jest');
const standard = require('eslint-config-standard');
const importPlugin = require('eslint-plugin-import');
const nPlugin = require('eslint-plugin-n');
const promisePlugin = require('eslint-plugin-promise');

module.exports = [
  // Konfigurasi global untuk semua file
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        Bun: 'readonly' // Menambahkan 'Bun' sebagai variabel global
      }
    },
    plugins: {
      import: importPlugin,
      n: nPlugin,
      promise: promisePlugin
    },
    rules: {
      ...standard.rules,
      // --- PENYESUAIAN UTAMA ---
      camelcase: 'off', // 1. Menonaktifkan aturan camelcase
      'no-throw-literal': 'off', // 2. Menonaktifkan sementara, perbaiki nanti
      semi: ['error', 'always'],
      quotes: ['error', 'single']
    }
  },

  // Aturan dasar dari ESLint
  js.configs.recommended,

  // Konfigurasi khusus untuk file tes Jest
  {
    ...jestPlugin.configs['flat/recommended'],
    files: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js']
  },

  // Mengabaikan folder yang tidak perlu di-lint
  {
    ignores: ['node_modules/']
  }
];
