import { format as _format, formatDistance as _formatDistance, formatDistanceStrict as _formatDistanceStrict, formatDuration as _formatDuration, endOfMonth, startOfMonth } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'

import { i18n } from '@/locales'

export * from './path'

export function complement(num: number) {
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
  return _format(date, format, {
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

export function formatDistance(
  date: Date | number,
  baseDate: Date | number,
  options?: {
    includeSeconds?: boolean
    addSuffix?: boolean
    locale?: Locale
  },
) {
  return _formatDistance(date, baseDate, {
    locale: dateFnsLocale(),
    includeSeconds: true,
    ...options,
  })
}

export function formatDistanceStrict(
  date: Date | number,
  baseDate: Date | number,
  options?: {
    addSuffix?: boolean
    unit?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'
    roundingMethod?: 'floor' | 'ceil' | 'round'
    locale?: Locale
  },
) {
  return _formatDistanceStrict(date, baseDate, {
    locale: dateFnsLocale(),
    unit: 'minute',
    ...options,
  })
}

export function formatDuration(
  duration: Duration,
  options?: {
    format?: string[]
    zero?: boolean
    delimiter?: string
    locale?: Locale
  },
) {
  return _formatDuration(duration, {
    locale: dateFnsLocale(),
    zero: true,
    ...options,
  })
}

export function formatHHmmss(time: number) {
  const { hour, minute, second } = extractTime(time).raw
  if (hour == 0 && minute == 0) {
    return formatDuration({
      seconds: second,
    })
  }
  if (hour == 0) {
    return formatDuration({
      minutes: minute,
    })
  }
  return formatDuration({
    hours: hour,
    minutes: minute,
  })
}

export function randomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * 16)]

  return color
}

export const createIconBlob = (buffer: number[]) => new Blob([new Uint8Array(buffer)], { type: 'image/png' })

export function excludeKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = {} as T
  Object.keys(obj).forEach((key) => {
    if (!keys.includes(key as K))
      result[key as keyof T] = obj[key as keyof T]
  })
  return result
}

export function sortObjectsByKey<T>(arr: T[], key: keyof T, desc = true): T[] {
  return arr.sort((a, b) => {
    if (a[key] < b[key])
      return desc ? 1 : -1

    else if (a[key] > b[key])
      return desc ? -1 : 1

    else
      return 0
  })
}
