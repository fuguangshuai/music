/**
 * Vitest 测试配置
 * 为重构后的代码提供完整的测试环境
 */

import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue() as any], // 简化类型，避免版本冲突
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@i18n': resolve(__dirname, 'src/i18n')
    }
  },
  test: {
    // 测试环境配置
    environment: 'jsdom',
    
    // 全局设置
    globals: true,
    
    // 覆盖率配置
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
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // 测试文件匹配模式
    include: [
      'tests/**/*.{test,spec}.{js,ts,vue}',
      'src/**/*.{test,spec}.{js,ts,vue}'
    ],
    
    // 排除文件
    exclude: [
      'node_modules/',
      'dist/',
      'out/',
      '.git/',
      '.vscode/'
    ],
    
    // 测试超时设置
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 并发设置（简化配置）
    pool: 'threads',
    
    // 报告器配置
    reporters: ['verbose'] as any, // 简化配置
    
    // 设置文件
    setupFiles: ['./tests/setup.ts'],
    
    // 模拟配置
    deps: {
      inline: ['naive-ui', '@vueuse/core']
    },

    // 性能测试配置
    benchmark: {
      include: ['tests/**/*.{bench,benchmark}.{js,ts}'],
      exclude: ['node_modules/', 'dist/'],
      reporters: ['verbose'] as any, // 简化类型
      outputFile: './benchmark-results.json'
    }
  }
});
