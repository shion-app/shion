import { enUS, zhCN } from 'date-fns/locale'
import { format as _format, formatDuration as _formatDuration, isSameYear } from 'date-fns'

export function useDateFns() {
  const { locale: l } = useI18n()
  const locale = computed(() => l.value == 'zh-CN' ? zhCN : enUS)

  const format: typeof _format = (...args) => {
    const [date, format, options] = args
    return _format(date, format, {
      locale: locale.value,
      ...options,
    },
    )
  }

  const formatDuration: typeof _formatDuration = (...args) => {
    const [duration, options] = args
    return _formatDuration(duration, {
      locale: locale.value,
      zero: true,
      ...options,
    },
    )
  }

  function formatHHmmss(time: number) {
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
    const hours = hour + Number((minute / 60).toFixed(1))
    return formatDuration({
      hours,
    })
  }

  function formatYYYYmmdd(date: Date | number, options: {
    minute?: boolean
    year?: boolean
  } = {
    minute: false, year: false,
  }) {
    const { minute, year } = options
    let formatStr = (isSameYear(new Date(), date) && !year) ? 'MM-dd' : 'yyyy-MM-dd'
    if (minute)
      formatStr += ' HH:mm'

    return format(date, formatStr)
  }

  return {
    format,
    formatHHmmss,
    formatYYYYmmdd,
  }
}
