import colors from 'vuetify/util/colors'

import type { ActiveStatusMap } from './types'
import { db } from '@/modules/database'

type CalendarStatusAdapter = (start: number, end: number, id: number) => Promise<ActiveStatusMap>

export function useAdapter() {
  const { format, formatHHmmss } = useDateFns()
  const { t } = useI18n()
  const { getList: getObsidianNoteList } = useObsidian()

  function calcTime(list: Array<{
    start: number
    end: number
  }>, start: number, end: number) {
    const data = splitByDay(list, [new Date(start), new Date(end)]).map(i => ({
      start: i.start,
      end: i.end,
    }))
    const timeMap = new Map<string, number>()
    for (const { start, end } of data) {
      const date = format(start, 'yyyy-MM-dd')
      timeMap.set(date, (timeMap.get(date) || 0) + end - start)
    }
    const map: ActiveStatusMap = new Map()
    for (const key of timeMap.keys()) {
      const value = timeMap.get(key)!
      map.set(key, {
        color: getColorByTime(value),
        text: formatHHmmss(value),
      })
    }
    return map
  }

  function calcVisit(list: Array<{
    time: number
  }>) {
    const timeMap = new Map<string, number>()
    for (const { time } of list) {
      const date = format(time, 'yyyy-MM-dd')
      timeMap.set(date, (timeMap.get(date) || 0) + 1)
    }
    const map: ActiveStatusMap = new Map([...timeMap].map(([key, value]) => [key, {
      color: getColorByVisit(value),
      text: t('calendar.tooltip.visit', {
        visit: value,
      }),
    }]))
    return map
  }

  function calcCount(list: Array<{
    time: number
  }>) {
    const timeMap = new Map<string, number>()
    for (const { time } of list) {
      const date = format(time, 'yyyy-MM-dd')
      timeMap.set(date, (timeMap.get(date) || 0) + 1)
    }
    const map: ActiveStatusMap = new Map([...timeMap].map(([key, value]) => [key, {
      color: getColorByCount(value),
      text: t('calendar.tooltip.count', {
        count: value,
      }),
    }]))
    return map
  }

  function getColorByTime(time: number) {
    const { hour } = extractTime(time).raw
    if (hour < 1)
      return colors.green.lighten5
    if (hour < 2)
      return colors.green.lighten3
    if (hour < 3)
      return colors.green.lighten1
    if (hour < 5)
      return colors.green.darken2
    return colors.green.darken4
  }

  function getColorByVisit(visit: number) {
    if (visit < 10)
      return colors.green.lighten5
    if (visit < 30)
      return colors.green.lighten3
    if (visit < 50)
      return colors.green.lighten1
    if (visit < 70)
      return colors.green.darken2
    return colors.green.darken4
  }

  function getColorByCount(count: number) {
    if (count < 3)
      return colors.green.lighten1
    if (count < 6)
      return colors.green.darken2
    return colors.green.darken4
  }

  const planAdapter: CalendarStatusAdapter = async (start, end, id) => {
    return calcTime(await db.note.select({
      start,
      end,
      planId: id,
    }), start, end)
  }

  const labelAdapter: CalendarStatusAdapter = async (start, end, id) => {
    return calcTime(await db.note.select({
      start,
      end,
      labelId: id,
    }), start, end)
  }

  const monitorAdapter: CalendarStatusAdapter = async (start, end, id) => {
    return calcTime(await db.activity.select({
      start,
      end,
      programId: id,
    }), start, end)
  }

  const historyAdapter: CalendarStatusAdapter = async (start, end, id) => {
    return calcVisit((await db.history.select({
      start,
      end,
      domainId: id,
    })).map(i => ({
      time: i.lastVisited,
    })))
  }

  const momentAdapter: CalendarStatusAdapter = async (start, end, id) => {
    return calcCount((await getObsidianNoteList(start, end)).filter(i => i.group_id == id).map(i => ({
      time: i.created,
    })))
  }

  return {
    planAdapter,
    labelAdapter,
    monitorAdapter,
    historyAdapter,
    momentAdapter,
  }
}
