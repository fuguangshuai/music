/**
 * 统一配置工厂
 *
 * 目标：整合项目中重复的配置模式，提供统一的配置管理
 *
 * 整合内容：
 * 1. Vite 配置模式（来自 vite.config.ts 和 electron.vite.config.ts）
 * 2. TypeScript 配置模式（来自 tsconfig.*.json）
 * 3. ESLint 配置模式（来自 eslint.config.mjs）
 * 4. 路径别名配置
 * 5. 插件配置
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import { resolve } from 'path';

// ============================================================================
// 统一的路径别名配置
// ============================================================================

/**
 * 路径别名配置接口
 */
export interface PathAliasConfig {
  '@': string;
  '@renderer'?: string;
  '@main'?: string;
  '@i18n': string;
}

/**
 * 创建统一的路径别名配置
 */
export const createPathAliases = (rootDir: string = process.cwd()): PathAliasConfig => {
  return {
    '@': resolve(rootDir, 'src/renderer'),
    '@renderer': resolve(rootDir, 'src/renderer'),
    '@main': resolve(rootDir, 'src/main'),
    '@i18n': resolve(rootDir, 'src/i18n')
  };
};

/**
 * 为 Vite 格式化路径别名
 */
export const formatAliasesForVite = (aliases: PathAliasConfig) => {
  return Object.fromEntries(Object.entries(aliases).map(([key, value]) => [key, value]));
};

/**
 * 为 TypeScript 格式化路径别名
 */
export const formatAliasesForTypeScript = (aliases: PathAliasConfig) => {
  return Object.fromEntries(
    Object.entries(aliases).map(([key, value]) => [
      `${key}/*`,
      [`${value.replace(process.cwd(), '.')}/*`]
    ])
  );
};

// ============================================================================
// 统一的插件配置
// ============================================================================

/**
 * 通用插件配置接口
 */
export interface CommonPluginConfig {
  vue: boolean;
  compression: boolean;
  devtools: boolean;
  autoImport: boolean;
  components: boolean;
}

/**
 * AutoImport 配置
 */
export const createAutoImportConfig = () => ({
  imports: [
    'vue',
    {
      'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar']
    }
  ]
});

/**
 * Components 配置
 */
export const createComponentsConfig = () => ({
  resolvers: [
    // 动态导入以避免构建时依赖问题
    (() => {
      try {
        const { NaiveUiResolver } = require('unplugin-vue-components/resolvers');
        return NaiveUiResolver();
      } catch {
        return null;
      }
    })()
  ].filter(Boolean)
});

/**
 * VueDevTools 配置
 */
export const createVueDevToolsConfig = (options: { launchEditor?: string } = {}) => ({
  launchEditor: options.launchEditor || 'code'
});

// ============================================================================
// 统一的服务器配置
// ============================================================================

/**
 * 服务器配置接口
 */
export interface ServerConfig {
  host: string;
  port?: number;
  proxy?: Record<string, any>;
}

/**
 * 创建开发服务器配置
 */
export const createServerConfig = (options: Partial<ServerConfig> = {}): ServerConfig => {
  return {
    host: '0.0.0.0',
    port: options.port || 50088,
    proxy: options.proxy || {}
  };
};

// ============================================================================
// 统一的 TypeScript 配置
// ============================================================================

/**
 * TypeScript 编译选项配置
 */
export interface TypeScriptConfig {
  target: string;
  module: string;
  moduleResolution: string;
  strict: boolean;
  jsx?: string;
  sourceMap: boolean;
  skipLibCheck: boolean;
  resolveJsonModule: boolean;
  esModuleInterop: boolean;
  composite?: boolean;
}

/**
 * 创建基础 TypeScript 配置
 */
export const createBaseTypeScriptConfig = (): TypeScriptConfig => ({
  target: 'esnext',
  module: 'esnext',
  moduleResolution: 'node',
  strict: true,
  jsx: 'preserve',
  sourceMap: true,
  skipLibCheck: true,
  resolveJsonModule: true,
  esModuleInterop: true,
  composite: true
});

/**
 * 创建 Web TypeScript 配置
 */
export const createWebTypeScriptConfig = (
  baseConfig: TypeScriptConfig = createBaseTypeScriptConfig()
) => ({
  ...baseConfig,
  types: ['naive-ui/volar', './src/renderer/auto-imports.d.ts', './src/renderer/components.d.ts']
});

/**
 * 创建 Node TypeScript 配置
 */
export const createNodeTypeScriptConfig = (
  baseConfig: TypeScriptConfig = createBaseTypeScriptConfig()
) => ({
  ...baseConfig,
  types: ['electron-vite/node'],
  moduleResolution: 'bundler'
});

// ============================================================================
// 统一的 ESLint 配置
// ============================================================================

/**
 * ESLint 规则配置
 */
export interface ESLintRulesConfig {
  typescript: Record<string, any>;
  vue: Record<string, any>;
  common: Record<string, any>;
}

/**
 * 创建 TypeScript ESLint 规则
 */
export const createTypeScriptESLintRules = (): Record<string, any> => ({
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '.*', args: 'none' }],
  '@typescript-eslint/no-use-before-define': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/ban-types': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off'
});

/**
 * 创建 Vue ESLint 规则
 */
export const createVueESLintRules = (): Record<string, any> => ({
  'vue/no-unused-vars': 'error',
  'vue/no-unused-components': 'error',
  'vue/no-multiple-template-root': 'off',
  'vue/no-v-model-argument': 'off',
  'vue/require-default-prop': 'off',
  'vue/multi-word-component-names': 'off',
  'vue/component-name-in-template-casing': ['error', 'kebab-case'],
  'vue/no-reserved-props': 'off',
  'vue/no-v-html': 'off',
  'vue/first-attribute-linebreak': 'off'
});

/**
 * 创建通用 ESLint 规则
 */
export const createCommonESLintRules = (): Record<string, any> => ({
  'no-console': 'off',
  'no-underscore-dangle': 'off',
  'no-nested-ternary': 'off',
  'no-await-in-loop': 'off',
  'no-continue': 'off',
  'no-restricted-syntax': 'off',
  'no-return-assign': 'off',
  'no-unused-expressions': 'off',
  'no-return-await': 'off',
  'no-plusplus': 'off',
  'no-param-reassign': 'off',
  'no-shadow': 'off',
  'guard-for-in': 'off',
  'class-methods-use-this': 'off',
  'no-case-declarations': 'off',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error'
});

// ============================================================================
// 统一的构建配置
// ============================================================================

/**
 * 构建配置接口
 */
export interface BuildConfig {
  target: string;
  outDir: string;
  sourcemap: boolean;
  minify: boolean;
  rollupOptions?: Record<string, any>;
}

/**
 * 创建生产构建配置
 */
export const createProductionBuildConfig = (): BuildConfig => ({
  target: 'esnext',
  outDir: 'dist',
  sourcemap: true,
  minify: true,
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['vue', 'vue-router', 'pinia'],
        ui: ['naive-ui'],
        utils: ['lodash', 'axios']
      }
    }
  }
});

/**
 * 创建开发构建配置
 */
export const createDevelopmentBuildConfig = (): BuildConfig => ({
  target: 'esnext',
  outDir: 'dist',
  sourcemap: true,
  minify: false
});

// ============================================================================
// 配置工厂主函数
// ============================================================================

/**
 * 配置工厂选项
 */
export interface ConfigFactoryOptions {
  rootDir?: string;
  environment?: 'development' | 'production';
  platform?: 'web' | 'electron';
}

/**
 * 统一配置工厂
 */
export class UnifiedConfigFactory {
  private options: Required<ConfigFactoryOptions>;

  constructor(options: ConfigFactoryOptions = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      environment: options.environment || 'development',
      platform: options.platform || 'web'
    };
  }

  /**
   * 获取路径别名配置
   */
  getPathAliases(): PathAliasConfig {
    return createPathAliases(this.options.rootDir);
  }

  /**
   * 获取 Vite 配置
   */
  getViteConfig() {
    const aliases = this.getPathAliases();
    const serverConfig = createServerConfig();

    return {
      resolve: {
        alias: formatAliasesForVite(aliases)
      },
      server: serverConfig,
      build:
        this.options.environment === 'production'
          ? createProductionBuildConfig()
          : createDevelopmentBuildConfig()
    };
  }

  /**
   * 获取 TypeScript 配置
   */
  getTypeScriptConfig() {
    const aliases = this.getPathAliases();
    const baseConfig = createBaseTypeScriptConfig();

    return {
      compilerOptions: {
        ...baseConfig,
        paths: formatAliasesForTypeScript(aliases)
      }
    };
  }

  /**
   * 获取 ESLint 配置
   */
  getESLintConfig() {
    return {
      typescript: createTypeScriptESLintRules(),
      vue: createVueESLintRules(),
      common: createCommonESLintRules()
    };
  }
}

// ============================================================================
// 便捷导出
// ============================================================================

/**
 * 创建配置工厂实例
 */
export const createConfigFactory = (options?: ConfigFactoryOptions) => {
  return new UnifiedConfigFactory(options);
};

/**
 * 默认配置工厂实例
 */
export const defaultConfigFactory = createConfigFactory();
