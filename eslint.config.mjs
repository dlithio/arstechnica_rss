// Import the necessary ESLint plugins
import { FlatCompat } from '@eslint/eslintrc';
import eslintPluginJestDom from 'eslint-plugin-jest-dom';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginTestingLibrary from 'eslint-plugin-testing-library';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  {
    // Define global configuration
    ignores: ['node_modules/**', '.next/**', 'out/**'],
  },
  
  // Use Next.js's ESLint configurations
  ...new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: {},
  }).extends('next/core-web-vitals'),
  
  // Add custom plugin configurations
  {
    plugins: {
      'simple-import-sort': eslintPluginSimpleImportSort,
      'react-hooks': eslintPluginReactHooks,
      'testing-library': eslintPluginTestingLibrary,
      'jest-dom': eslintPluginJestDom,
      'unused-imports': eslintPluginUnusedImports,
    },
    rules: {
      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      
      // React hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Testing library
      'testing-library/await-async-queries': 'error',
      'testing-library/no-await-sync-queries': 'error',
      'testing-library/no-container': 'error',
      'testing-library/no-debugging-utils': 'warn',
      'testing-library/no-dom-import': 'error',
      'testing-library/prefer-find-by': 'error',
      'testing-library/prefer-screen-queries': 'error',
      
      // Jest DOM
      'jest-dom/prefer-checked': 'error',
      'jest-dom/prefer-enabled-disabled': 'error',
      'jest-dom/prefer-focus': 'error',
      'jest-dom/prefer-in-document': 'error',
      'jest-dom/prefer-required': 'error',
      'jest-dom/prefer-to-have-attribute': 'error',
      'jest-dom/prefer-to-have-class': 'error',
      'jest-dom/prefer-to-have-style': 'error',
      'jest-dom/prefer-to-have-text-content': 'error',
      'jest-dom/prefer-to-have-value': 'error',
      
      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { 'vars': 'all', 'varsIgnorePattern': '^_', 'args': 'after-used', 'argsIgnorePattern': '^_' }
      ]
    }
  }
];

export default config;

