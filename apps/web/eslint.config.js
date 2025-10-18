import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        // React globals
        React: 'readonly',
        JSX: 'readonly',
        // Google Maps
        google: 'readonly',
        // Kakao Maps
        kakao: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['*.config.js', '*.config.ts'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.turbo/', 'vite.config.ts'],
  },
];
