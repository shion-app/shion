import 'uno.css'
import 'ant-design-vue/es/message/style/css'
import '@unocss/reset/tailwind.css'
import './styles/index.css'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { i18n } from '@locales/index'
import App from './App.vue'
import routes from '~pages'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const pinia = createPinia()

createApp(App).use(i18n).use(router).use(pinia).mount('#app')
