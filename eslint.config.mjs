import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import vueScopedCss from 'eslint-plugin-vue-scoped-css';
import globals from 'globals';

export default [
  // 忽略文件配置
  {
    ignores: ['node_modules/**', 'dist/**', 'out/**', '.gitignore'],
  },

  // 基础 JavaScript 配置
  js.configs.recommended,

  // JavaScript 文件配置
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'error',
    },
  },

  // TypeScript 文件配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowImportExportEverywhere: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        // Vue 3 特定全局变量
        defineProps: 'readonly',
        defineEmits: 'readonly',
        // TypeScript 全局类型
        NodeJS: 'readonly',
        ScrollBehavior: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error', // 🔧 启用any类型检查，使用error强制修复
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern:
            '^_|^e$|^event$|^error$|^data$|^callback$|^args$|^value$|^loading$|^width$|^height$|^showPlaylist$|^id$|^enabledSources$|^progress$|^status$|^success$|^filePath$|^locale$|^channel$|^listener$|^url$|^songId$|^delta$|^item$|^err$|^gradient$|^theme$',
          varsIgnorePattern:
            '^_|^e$|^event$|^error$|^data$|^callback$|^args$|^NONE$|^TIME$|^SONGS$|^PLAYLIST_END$|^c$|^l$|^Window$|^key$|^color$',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true, // 允许表达式不需要返回类型
          allowTypedFunctionExpressions: true, // 允许已类型化的函数表达式
          allowHigherOrderFunctions: true, // 允许高阶函数
        },
      ], // 🔧 启用函数返回类型检查
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-console': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern:
            '^_|^e$|^event$|^error$|^data$|^callback$|^args$|^value$|^loading$|^width$|^height$|^showPlaylist$|^id$|^enabledSources$|^progress$|^status$|^success$|^filePath$|^locale$|^channel$|^listener$|^url$|^songId$|^delta$|^item$|^err$|^gradient$|^theme$',
          varsIgnorePattern:
            '^_|^e$|^event$|^error$|^data$|^callback$|^args$|^NONE$|^TIME$|^SONGS$|^PLAYLIST_END$|^c$|^l$|^Window$|^key$|^color$',
          ignoreRestSiblings: true,
        },
      ],
      'no-use-before-define': 'off',
      'max-classes-per-file': 'off',
      'no-await-in-loop': 'off',
      'dot-notation': 'off',
      'constructor-super': 'off',
      'getter-return': 'off',
      'no-const-assign': 'off',
      'no-dupe-args': 'off',
      'no-dupe-class-members': 'off',
      'no-dupe-keys': 'off',
      'no-func-assign': 'off',
      'no-import-assign': 'off',
      'no-new-symbol': 'off',
      'no-obj-calls': 'off',
      'no-redeclare': 'off',
      'no-setter-return': 'off',
      'no-this-before-super': 'off',
      'no-undef': 'off',
      'no-unreachable': 'warn', // 🔧 启用不可达代码检查
      'no-unsafe-negation': 'warn', // 🔧 启用不安全否定检查
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'valid-typeof': 'off',
      'consistent-return': 'off',
      'no-promise-executor-return': 'off',
      'prefer-promise-reject-errors': 'off',
    },
  },

  // Vue 文件配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowImportExportEverywhere: true,
      },
      globals: {
        ...globals.browser,
        // Vue 3 特定全局变量
        defineProps: 'readonly',
        defineEmits: 'readonly',
        // Vue 3 Composition API (如果使用了 unplugin-auto-import)
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        onBeforeUnmount: 'readonly',
        nextTick: 'readonly',
        inject: 'readonly',
        provide: 'readonly',
        // Naive UI (如果使用了 unplugin-auto-import)
        useDialog: 'readonly',
        useMessage: 'readonly',
        // TypeScript 全局类型
        NodeJS: 'readonly',
        ScrollBehavior: 'readonly',
      },
    },
    plugins: {
      vue,
      '@typescript-eslint': typescript,
      prettier,
      'simple-import-sort': simpleImportSort,
      'vue-scoped-css': vueScopedCss,
    },
    rules: {
      // Vue 3 推荐规则
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'error',
      'vue/no-multiple-template-root': 'off',
      'vue/no-v-model-argument': 'off',
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': ['error', 'kebab-case'],
      'vue/no-reserved-props': 'off',
      'vue/no-v-html': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue-scoped-css/enforce-style-type': [
        'error',
        {
          allows: ['scoped'],
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off', // Vue组件中关闭，避免过于严格
      '@typescript-eslint/no-explicit-any': 'warn', // Vue文件中使用warn，逐步改进
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  // TypeScript 类型定义文件配置
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
    },
  },

  // JavaScript 第三方库文件配置
  {
    files: ['**/assets/**/*.js', '**/vendor/**/*.js', '**/lib/**/*.js'],
    rules: {
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'no-self-assign': 'off',
      'no-undef': 'off',
    },
  },

  // 通用规则
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue'],
    rules: {
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
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern:
            '^_|^e$|^event$|^error$|^data$|^callback$|^args$|^value$|^loading$|^width$|^height$|^showPlaylist$|^id$|^enabledSources$|^progress$|^status$|^success$|^filePath$|^locale$|^channel$|^listener$|^url$|^songId$|^delta$|^item$|^err$|^gradient$|^theme$',
          varsIgnorePattern:
            '^_|^e$|^event$|^error$|^data$|^callback$|^args$|^NONE$|^TIME$|^SONGS$|^PLAYLIST_END$|^c$|^l$|^Window$|^key$|^color$',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];
