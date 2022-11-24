import 'uno.css'
import '@unocss/reset/tailwind.css'
import 'vuetify/styles'

import { createRouter, createWebHashHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import { createI18n } from 'vue-i18n'
import messages from '@intlify/vite-plugin-vue-i18n/messages'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { createPinia } from 'pinia'

import App from './App.vue'
import routes from '~pages'

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
})

const i18n = createI18n({
  locale: 'zh',
  messages,
})

const pinia = createPinia()

createApp(App).use(router).use(vuetify).use(i18n).use(pinia).mount('#app')
