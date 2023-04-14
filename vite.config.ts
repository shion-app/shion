import { join } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Unocss from 'unocss/vite'
import { presetAttributify, presetUno } from 'unocss'
import presetIcons from '@unocss/preset-icons'
import Components from 'unplugin-vue-components/vite'
import { Vuetify3Resolver } from 'unplugin-vue-components/resolvers'

// const mobile =
//   process.env.TAURI_PLATFORM === "android" ||
//   process.env.TAURI_PLATFORM === "ios";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    VueI18nPlugin({
      include: [join(__dirname, 'src/locales/**')],
    }),
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core',
        'vue-i18n',
      ],
      dirs: ["./src/hooks/**", "./src/database/**"],
      vueTemplate: true,
      dts: 'src/auto-imports.d.ts',
    }),
    Unocss({
      presets: [presetUno(), presetAttributify(), presetIcons()],
    }),
    Components({
      resolvers: [Vuetify3Resolver()],
      dts: 'src/components.d.ts',
    }),
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
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
}))
