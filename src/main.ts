import 'uno.css'
import '@unocss/reset/tailwind.css'
import './styles/index.scss'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'

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
import App from './App.vue'
import routes from '~pages'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const pinia = createPinia()

const vuetify = createVuetify()

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
  .component('v-chart', VChart)
  .mount('#app')

if (!import.meta.env.TAURI_DEBUG)
  window.addEventListener('contextmenu', e => e.preventDefault())
