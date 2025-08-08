/**
 * Vitest 测试配置
 * 为重构后的代码提供完整的测试环境
 */

import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@i18n': resolve(__dirname, 'src/i18n'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'out/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    include: ['tests/**/*.{test,spec}.{js,ts,vue}', 'src/**/*.{test,spec}.{js,ts,vue}'],
    exclude: ['node_modules/', 'dist/', 'out/', '.git/', '.vscode/'],
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    reporters: ['default', 'verbose'],
    setupFiles: ['./tests/setup.ts'],
    deps: {
      inline: ['naive-ui', '@vueuse/core'],
    },
    benchmark: {
      include: ['tests/**/*.{bench,benchmark}.{js,ts}'],
      exclude: ['node_modules/', 'dist/'],
      reporters: ['verbose'],
      outputFile: './benchmark-results.json',
    },
  },
});
