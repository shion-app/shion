import { format as dateFormat, endOfMonth, startOfMonth } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'

import { i18n } from '@locales/index'

function complement(num: number) {
  return num < 10 ? `0${num}` : `${num}`
}

export function extractTime(time: number) {
  const milli = (time % 1000)
  time = ~~(time / 1000)
  const second = time % 60
  time = ~~(time / 60)
  const minute = time % 60
  const hour = ~~(time / 60)
  return {
    raw: {
      milli,
      second,
      minute,
      hour,
    },
    complement: {
      milli: complement(~~(milli / 10)),
      second: complement(second),
      minute: complement(minute),
      hour: complement(hour),
    },
  }
}

export function getRangeOfMonth(date: Date) {
  return {
    start: startOfMonth(date).getTime(),
    end: endOfMonth(date).getTime(),
  }
}

export function format(date: Date | number,
  format: string,
  options?: {
    locale?: Locale
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    firstWeekContainsDate?: number
    useAdditionalWeekYearTokens?: boolean
    useAdditionalDayOfYearTokens?: boolean
  }) {
  return dateFormat(date, format, {
    locale: dateFnsLocale(),
    ...options,
  })
}

function dateFnsLocale() {
  // @ts-expect-error https://github.com/intlify/vue-i18n-next/issues/1003
  switch (i18n.global.locale.value) {
    case 'zh-CN':
      return zhCN

    default:
      return enUS
  }
}
