import baseConfig from './base.js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export const config = defineConfig(...baseConfig, {
  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooks,
  },
  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
});

export default config;
