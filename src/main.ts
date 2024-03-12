import 'uno.css'
import '@unocss/reset/tailwind.css'
import 'vue-final-modal/style.css'
import '@mdi/font/css/materialdesignicons.css'
import 'gridstack/dist/gridstack.min.css'
import 'driver.js/dist/driver.css'
import './styles/index.scss'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { createVfm } from 'vue-final-modal'
import vueEcharts from 'vue-echarts'
import { GesturePlugin } from '@vueuse/gesture'
import { MotionPlugin } from '@vueuse/motion'

import App from './App.vue'
import routes from '~pages'

import { i18n } from '@/locales'
import { vuetify } from '@/plugins/vuetify'
import '@/plugins/zod'
import '@/plugins/echarts'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const pinia = createPinia()

const vfm = createVfm()

createApp(App)
  .use(i18n)
  .use(router)
  .use(pinia)
  .use(vuetify)
  .use(vfm)
  .use(GesturePlugin)
  .use(MotionPlugin)
  .component('vueEcharts', vueEcharts)
  .mount('#app')

if (!import.meta.env.TAURI_DEBUG)
  window.addEventListener('contextmenu', e => e.preventDefault())
