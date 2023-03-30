import 'uno.css'
import '@unocss/reset/tailwind.css'
import './styles/index.scss'

import { createVuetify } from 'vuetify'
import { createApp } from 'vue'

import { createI18n } from 'vue-i18n'
import messages from '@intlify/unplugin-vue-i18n/messages'
import App from './App.vue'

const vuetify = createVuetify()

const i18n = createI18n({
  locale: 'en-US',
  messages,
})

createApp(App).use(vuetify).use(i18n).mount('#app')
