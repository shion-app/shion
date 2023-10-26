import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Unocss from 'unocss/vite'
import { presetAttributify, presetUno } from 'unocss'
import presetIcons from '@unocss/preset-icons'
import Components from 'unplugin-vue-components/vite'
import { Vuetify3Resolver } from 'unplugin-vue-components/resolvers'
import Pages from 'vite-plugin-pages'
import tsconfigPaths from 'vite-tsconfig-paths'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vitest/config'
import transformerDirectives from '@unocss/transformer-directives'

// const mobile =
//   process.env.TAURI_PLATFORM === "android" ||
//   process.env.TAURI_PLATFORM === "ios";

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
      presets: [presetUno(), presetAttributify(), presetIcons()],
      transformers: [transformerDirectives()],
    }),
    Components({
      resolvers: [Vuetify3Resolver()],
      dts: 'src/components.d.ts',
    }),
    Pages(),
    tsconfigPaths({
      loose: true,
    }),
    visualizer({
      filename: '.visualizer/index.html',
    }),
    // VueDevTools(),
  ],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  // prevent vite from obscuring rust errors
  clearScreen: false,
  // tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
  },
  // to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri supports es2021
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari15',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  test: {
    coverage: {
      reporter: ['html-spa', 'json-summary'],
    },
  },
})
