import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'src/services/**/*.js',
        'src/hooks/**/*.js',
        'src/utils/**/*.js',
        'api/**/*.js'
      ],
      exclude: [
        'api/_utils/cors.js',
        'api/_utils/logger.js',
        'src/utils/logger.js',
        '**/*.test.js'
      ],
      thresholds: {
        // Critical path targets
        'src/services/alertMatcher.js': {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80
        }
      }
    },
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@components': path.resolve(__dirname, './src/components')
    }
  }
});
