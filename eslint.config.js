import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'v2/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': 'off', // turned off for ts compatibility without parser
      'no-undef': 'off', // turn off to avoid TS issues
      'no-empty': 'warn',
      // Cyclomatic complexity: max 10 per function
      complexity: ['error', 10],
      // Max lines per function
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
      // Max nested callbacks / conditions
      'max-depth': ['warn', 4],
      // Max params per function
      'max-params': ['warn', 6],
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
]