import { enUS, zhCN } from 'date-fns/locale'
import { format as _format, formatDuration as _formatDuration } from 'date-fns'

export function useDateFns() {
  const { locale: l } = useI18n()
  const locale = l.value == 'zh-CN' ? zhCN : enUS

  const format: typeof _format = (...args) => {
    const [date, format, options] = args
    return _format(date, format, {
      locale,
      ...options,
    },
    )
  }

  const formatDuration: typeof _formatDuration = (...args) => {
    const [duration, options] = args
    return _formatDuration(duration, {
      locale,
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

  return {
    format,
    formatHHmmss,
  }
}
