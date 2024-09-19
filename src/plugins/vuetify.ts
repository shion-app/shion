import { createVuetify } from 'vuetify'
import { en, zhHans } from 'vuetify/locale'
import { VTimePicker } from 'vuetify/labs/VTimePicker'
import { VNumberInput } from 'vuetify/labs/VNumberInput'
import colors from 'vuetify/util/colors'

import mergeOptions from 'merge-options'
import DateFnsAdapter from '@date-io/date-fns'
import { enUS, zhCN } from 'date-fns/locale'

export const vuetify = createVuetify({
  components: {
    VTimePicker,
    VNumberInput,
  },
  locale: {
    locale: 'en-US',
    messages: {
      'en-US': en,
      'zh-CN': mergeOptions(zhHans, {
        datePicker: {
          title: '选择日期',
        },
        timePicker: {
          title: '选择时间',
        },
        confirmEdit: {
          ok: '确定',
          cancel: '取消',
        },
      }),
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
          'on-background': colors.grey.darken3,
        },
      },
      dark: {
        colors: {
          primary: '#512DA8',
          background: '#313131', // uno-card
          surface: colors.grey.darken3, // uno-card-surface
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
    VSlider: {
      color: 'primary',
    },
    VCheckboxBtn: {
      color: 'primary',
    },
    VRadioGroup: {
      color: 'primary',
    },
  },
})
