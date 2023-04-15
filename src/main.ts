import 'uno.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import messages from '@intlify/unplugin-vue-i18n/messages'
import App from './App.vue'
import routes from '~pages'

const i18n = createI18n({
  locale: 'en-US',
  messages,
})

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

createApp(App).use(i18n).use(router).mount('#app')
