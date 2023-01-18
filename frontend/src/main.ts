import 'uno.css'
import '@unocss/reset/tailwind.css'
import './styles/index.scss'

import { createRouter, createWebHashHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import { createI18n } from 'vue-i18n'
import messages from '@intlify/vite-plugin-vue-i18n/messages'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { createPinia } from 'pinia'

import App from './App.vue'
import routes from '~pages'

import './prevent'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: Color.PRIMARY,
        },
      },
    },
  },
})

const i18n = createI18n({
  locale: 'en-US',
  messages,
})

const pinia = createPinia()

createApp(App).use(router).use(vuetify).use(i18n).use(pinia).mount('#app')
