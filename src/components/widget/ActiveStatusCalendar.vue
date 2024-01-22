<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { addDays, getDay, isBefore, isSameDay, isSameYear } from 'date-fns'

import { type SelectActivity, type SelectNote, db } from '@/modules/database'

const props = defineProps<{
  selectedDate: Date
}>()

const { selectedDate: selectedDateVModel } = useVModels(props)

const configStore = useConfigStore()

const { format, formatHHmmss } = useDateFns()

const { config } = storeToRefs(configStore)

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const day = 51 * 7 + getDay(new Date())
const range = generateRange(day)

const list = computed(() => [
  ...splitByDay(noteList.value, range).map(i => ({
    start: i.start,
    end: i.end,
    name: i.label.name,
    color: i.label.color,
    type: 'note',
  })),
  ...splitByDay(activityList.value, range).map(i => ({
    start: i.start,
    end: i.end,
    name: i.program.name,
    color: i.program.color,
    type: 'activity',
  })),
])

const calendarList = computed(() => {
  const map = new Map<string, number>()
  for (const { start, end } of list.value) {
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

const min = computed(() => Math.min(...calendarList.value.map(([_, value]) => value)))
const max = computed(() => Math.max(...calendarList.value.map(([_, value]) => value)))

const buildMarker = color => `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`

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
      left: 50,
      top: 20,
      range: range.map(date => format(date, 'yyyy-MM-dd')),
      cellSize: 17,
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
      borderColor: 'transparent',
      formatter(params) {
        const [time, value] = params.value
        const date = new Date(time)
        const dateText = isSameYear(new Date(), date) ? format(date, 'MM-dd') : format(date, 'yyyy-MM-dd')
        const detail = list.value.filter(i => isSameDay(i.start, date))
        if (detail.length == 0)
          return ''

        const colorMap = new Map<string, string>()
        const timeMap = new Map<string, number>()
        for (const { name, start, end, type, color } of detail) {
          const key = `${type}|${name}`
          timeMap.set(key, (timeMap.get(key) || 0) + end - start)
          colorMap.set(key, color)
        }
        const displayList = [...timeMap.entries()]
          .map(([key, value]) => [key, value] as [string, number])
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => [key.split('|').pop(), value, colorMap.get(key)] as [string, number, string])
        const template = displayList.map(([name, time, color]) => `<div style="display: flex; align-items: center;">${buildMarker(color)}<span style="margin-left: 6px;">${name}</span><div style="min-width: 50px; flex-grow: 1;"></div>${formatHHmmss(time)}<span></span></div>`).join('')
        return `<div style="margin-bottom: 6px;">
                  <span>${dateText}</span>
                  <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${formatHHmmss(value)}</span>
                </div>
                <div>
                  ${template}
                </div>
                `
      },
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: calendarList.value,
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

function handleClick(params) {
  const [dateText] = params.data
  selectedDateVModel.value = new Date(dateText)
}

init()
</script>

<template>
  <vue-echarts :option="option" autoresize @click="handleClick" />
</template>
