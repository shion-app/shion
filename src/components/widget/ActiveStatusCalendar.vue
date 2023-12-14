<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { addDays, isBefore, isSameYear } from 'date-fns'

import { type SelectActivity, type SelectNote, db } from '@/modules/database'

const configStore = useConfigStore()

const { format, formatHHmmss } = useDateFns()

const { config } = storeToRefs(configStore)

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const day = 365
const range = generateRange(day)

const list = computed(() => {
  const array = [...splitByDay(noteList.value, range), ...splitByDay(activityList.value, range)]
  const map = new Map<string, number>()
  for (const { start, end } of array) {
    const date = format(start, 'yyyy-MM-dd')
    map.set(date, (map.get(date) || 0) + end - start)
  }
  const [start, end] = range
  for (let time = start; isBefore(time, end); time = addDays(time, 1)) {
    const date = format(time, 'yyyy-MM-dd')
    if (!map.get(date))
      map.set(date, 0)
  }
  return [...map.entries()]
})

const min = computed(() => Math.min(...list.value.map(([_, value]) => value)))
const max = computed(() => Math.max(...list.value.map(([_, value]) => value)))

const option = computed<EChartsOption>(() => {
  return {
    visualMap: {
      show: false,
      min: min.value,
      max: max.value,
      inRange: {
        color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      },
    },
    calendar: {
      left: 40,
      top: 30,
      width: '95%',
      range: range.map(date => format(date, 'yyyy-MM-dd')),
      splitLine: {
        show: false,
      },
      dayLabel: {
        nameMap: dayMap[config.value.locale] || dayMap['en-US'],
        firstDay: config.value.locale == 'zh-CN' ? 1 : 0,
      },
      monthLabel: {
        nameMap: config.value.locale == 'zh-CN' ? 'ZH' : 'EN',
      },
      yearLabel: {
        show: false,
      },
      itemStyle: {
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0)',
      },
    },
    tooltip: {
      formatter(params) {
        const [time, value] = params.value
        const date = new Date(time)
        const dateText = isSameYear(new Date(), date) ? format(date, 'MM-dd') : format(date, 'yyyy-MM-dd')
        return `<div style="margin-bottom: 6px;">${dateText}</div><div>${formatHHmmss(value)}</div>`
      },
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: list.value,
    },
  }
})

async function init() {
  const [start, end] = range.map(date => date.getTime())
    ;[noteList.value, activityList.value] = await Promise.all([
    db.note.select({
      start,
      end,
    }),
    db.activity.select({
      start,
      end,
    }),
  ])
}

init()
</script>

<template>
  <vue-echarts :option="option" autoresize />
</template>
