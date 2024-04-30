import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Unocss from 'unocss/vite'
import { presetAttributify, presetTypography, presetUno } from 'unocss'
import presetIcons from '@unocss/preset-icons'
import Components from 'unplugin-vue-components/vite'
import Pages from 'vite-plugin-pages'
import tsconfigPaths from 'vite-tsconfig-paths'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vitest/config'
import transformerDirectives from '@unocss/transformer-directives'
import vuetify from 'vite-plugin-vuetify'
import postCssPxToRem from 'postcss-pxtorem'
import postCssCalc from 'postcss-calc'
import { internalIpV4 } from 'internal-ip'

const mobile = !!/android|ios/.exec(process.env.TAURI_ENV_PLATFORM || '')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VueI18nPlugin({
      include: [resolve('src/locales/**.yaml')],
    }),
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core',
        'vue-i18n',
        'vue-router',
        'pinia',
      ],
      dirs: ['./src/hooks/**', './src/stores/**', './src/utils/**'],
      vueTemplate: true,
      dts: 'src/auto-imports.d.ts',
    }),
    Unocss({
      presets: [presetUno(), presetAttributify(), presetIcons(), presetTypography()],
      transformers: [transformerDirectives()],
    }),
    Components({
      dirs: ['src/components', mobile ? 'src/mobile/components' : 'src/desktop/components'],
      dts: 'src/components.d.ts',
    }),
    Pages({
      extendRoute: (route) => {
        if (route.path == '/collection')
          return { ...route, redirect: '/collection/plan' }

        if (route.path == '/record')
          return { ...route, redirect: '/record/timer' }

        return route
      },
    }),
    tsconfigPaths({
      loose: true,
    }),
    visualizer({
      filename: '.visualizer/index.html',
    }),
    vuetify({
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    // VueDevTools(),
  ],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  // prevent vite from obscuring rust errors
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  clearScreen: false,
  // tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: mobile ? '0.0.0.0' : false,
    hmr: mobile
      ? {
          protocol: 'ws',
          host: await internalIpV4(),
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  test: {
    coverage: {
      reporter: ['html-spa', 'json-summary'],
    },
  },
  css: {
    postcss: {
      plugins: [
        postCssPxToRem({
          rootValue: 16,
          propList: ['*', '!--v-*'],
        }),
        postCssCalc({}),
      ],
    },
  },
  build: {
    target: 'chrome89',
  },
})
