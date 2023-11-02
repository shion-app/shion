import { createVuetify } from 'vuetify'
import { en, zhHans } from 'vuetify/locale'

import DateFnsAdapter from '@date-io/date-fns'
import { enUS, zhCN } from 'date-fns/locale'

export const vuetify = createVuetify({
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
          'primary': '#1565c0',
          'secondary': '#2e7d32',
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
  },
})
