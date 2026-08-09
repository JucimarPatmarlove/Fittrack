import { resolve } from 'path';
import react from '@vitejs/plugin-react';
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Simula ambiente browser (para Web Crypto API, TextEncoder, etc.)
    environment: 'jsdom',
    // Ficheiro de setup global (polyfills e mocks globais)
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    // Aliases para coincidir com vite.config.js
    alias: {
      '@': resolve(__dirname, './src'),
    },
    // Excluir node_modules e dist e testes e2e do Playwright
    exclude: ['**/node_modules/**', '**/dist/**', '**/dev-dist/**', 'tests/e2e/**'],
    // Coverage com v8
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/utils/**', 'src/services/**'],
      exclude: ['src/**/*.test.ts', 'src/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
