import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: [
      'node_modules/',
      'dist/',
      '.next/',
      'tests/e2e/**', // Excluir E2E tests de Playwright
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'drizzle/',
        '.next/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.ts',
        '**/middleware.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
