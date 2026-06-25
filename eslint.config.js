import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'v2/**', 'node_modules/**']),
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]|^_|^C$' }],
      'no-empty': 'warn',
      // Cyclomatic complexity: max 10 per function (warn at 8, error at 15)
      complexity: ['warn', 12],
      // Max lines per function
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      // Max nested callbacks / conditions
      'max-depth': ['warn', 4],
      // Max params per function
      'max-params': ['warn', 5],
      // Prefer early returns
      'no-else-return': 'warn',
      // Consistent return
      'consistent-return': 'warn',
      // Avoid nested ternaries
      'no-nested-ternary': 'warn',
      // Max statements per function
      'max-statements': ['warn', 30],
    },
  },
])