import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import VueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(() => ({
  base: './',
  root: resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@i18n': resolve(__dirname, 'src/i18n')
    }
  },
  plugins: [
    vue(),
    viteCompression(),
    VueDevTools({
      launchEditor: 'code' // code, webstorm, cursor
    }),
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar']
        }
      ]
    }),
    Components({
      resolvers: [NaiveUiResolver()]
    }),
    // 性能分析插件（仅在分析模式下启用）
    process.env.ANALYZE &&
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
  ].filter(Boolean),
  publicDir: resolve(__dirname, 'resources'),
  server: {
    host: '0.0.0.0',
    port: 50088,
    proxy: {}
  }
}));
