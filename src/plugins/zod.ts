import i18next from 'i18next'
import { z } from 'zod'
import { zodI18nMap } from 'zod-i18n-map'

import enUS from 'zod-i18n-map/locales/en/zod.json'
import zhCN from 'zod-i18n-map/locales/zh-CN/zod.json'

i18next.init({
  lng: 'en-US',
  resources: {
    'en-US': { zod: enUS },
    'zh-CN': { zod: zhCN },
  },
})
z.setErrorMap(zodI18nMap)
