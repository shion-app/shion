import { join } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Unocss from 'unocss/vite'
import { presetAttributify, presetUno } from 'unocss'
import Pages from 'vite-plugin-pages'
import Components from 'unplugin-vue-components/vite'
import { Vuetify3Resolver } from 'unplugin-vue-components/resolvers'
import presetIcons from '@unocss/preset-icons'
import VueI18n from '@intlify/vite-plugin-vue-i18n'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      reactivityTransform: true,
    }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/core',
        'vue-i18n',
      ],
      vueTemplate: true,
      dts: 'src/auto-imports.d.ts',
      dirs: ['./wailsjs/**', './src/utils/**'],
    }),
    Unocss({
      presets: [presetUno(), presetAttributify(), presetIcons()],
      shortcuts: {},
    }),
    Pages(),
    Components({
      resolvers: [Vuetify3Resolver()],
      dts: 'src/components.d.ts',
    }),
    VueI18n({
      include: [join(__dirname, 'src/locales/**')],
    }),
  ],
})
