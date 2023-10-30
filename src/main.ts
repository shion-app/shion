import 'uno.css'
import '@unocss/reset/tailwind.css'
import 'vue-final-modal/style.css'
import '@mdi/font/css/materialdesignicons.css'
import './styles/index.scss'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { createVfm } from 'vue-final-modal'

import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'

import { i18n } from '@locales/index'
import { vuetify } from '@plugins/vuetify'
import App from './App.vue'
import routes from '~pages'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const pinia = createPinia()

const vfm = createVfm()

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GraphicComponent,
  DataZoomComponent,
])

createApp(App)
  .use(i18n)
  .use(router)
  .use(pinia)
  .use(vuetify)
  .use(vfm)
  .component('v-chart', VChart)
  .mount('#app')

if (!import.meta.env.TAURI_DEBUG)
  window.addEventListener('contextmenu', e => e.preventDefault())
