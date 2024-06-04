import { createVuetify } from 'vuetify'
import { en, zhHans } from 'vuetify/locale'
import { VTimePicker } from 'vuetify/labs/VTimePicker'

import DateFnsAdapter from '@date-io/date-fns'
import { enUS, zhCN } from 'date-fns/locale'

export const vuetify = createVuetify({
  components: {
    VTimePicker,
  },
  locale: {
    locale: 'en-US',
    messages: {
      'en-US': en,
      'zh-CN': zhHans,
    },
  },
  date: {
    adapter: DateFnsAdapter,
    locale: {
      'en-US': enUS,
      'zh-CN': zhCN,
    },
  },
  theme: {
    themes: {
      light: {
        colors: {
          'primary': '#512DA8',
          'on-background': '#424242',
        },
      },
    },
  },
  defaults: {
    VTextField: {
      variant: 'solo',
    },
    VSelect: {
      variant: 'solo',
    },
    VAutocomplete: {
      variant: 'solo',
    },
  },
})
