<script setup lang="ts">
import colors from 'vuetify/util/colors'
import type { EChartsOption } from 'echarts'
import Color from 'color'

import { addDays, getDay, isBefore, isSameYear } from 'date-fns'
import { type SelectActivity, type SelectNote, type SelectOverview, db } from '@/modules/database'

const props = defineProps<{
  data: SelectOverview['data']
}>()

const configStore = useConfigStore()

const { config } = storeToRefs(configStore)

const { format, formatHHmmss } = useDateFns()
const { position, theme } = useEcharts()

const CELL_SIZE = 17

const chartRef = ref()
const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])
const day = ref(30)

const { width } = useElementBounding(chartRef)

const range = computed(() => generateRange(day.value))

const list = computed(() => {
  return noteList.value.length > 0
    ? splitByDay(noteList.value, range.value).map(i => ({
      start: i.start,
      end: i.end,
      name: i.plan.name,
      color: i.plan.color,
    }))
    : splitByDay(activityList.value, range.value).map(i => ({
      start: i.start,
      end: i.end,
      name: i.program.name,
      color: i.program.color,

    }))
})

const calendarList = computed(() => {
  const map = new Map<string, number>()
  for (const { start, end } of list.value) {
    const date = format(start, 'yyyy-MM-dd')
    map.set(date, (map.get(date) || 0) + end - start)
  }
  const [start, end] = range.value
  for (let time = start; isBefore(time, end); time = addDays(time, 1)) {
    const date = format(time, 'yyyy-MM-dd')
    if (!map.get(date))
      map.set(date, 0)
  }
  return [...map.entries()]
})

const title = computed(() => props.data.widget?.title as string)
const color = computed(() => props.data.widget?.color as string)

async function refresh() {
  noteList.value = activityList.value = []
  const { query } = props.data
  if (!query)
    return

  const { table, where } = query
  const [start, end] = range.value
  const condition = {
    ...where,
    start: start.getTime(),
    end: end.getTime(),
  }
  if (table == db.note.table)
    noteList.value = await db.note.select(condition)

  else if (table == db.activity.table)
    activityList.value = await db.activity.select(condition)
}

const buildMarker = color => `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};" class="shrink-0"></span>`

function changeColor(value: string, index: number, length: number) {
  const color = Color(value)
  const isDark = color.isDark()
  if (isDark) {
    const ratio = (length - index) / length
    return color.lighten(ratio).toString()
  }
  else {
    const ratio = index / length
    return color.darken(ratio).toString()
  }
}

const option = computed<EChartsOption>(() => {
  const partition = [0.5, 1, 2, 3]
  const pieces = [
    {
      lte: calcDuration(0, 'hour'), color: colors.grey.lighten2,
    },
    ...partition.map((h, index) => ({
      lte: calcDuration(h, 'hour'), color: changeColor(color.value, index, partition.length),
    })),
  ]
  return {
    title: {
      text: title.value,
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
      },
    },
    visualMap: {
      show: false,
      type: 'piecewise',
      pieces,
    },
    calendar: {
      left: 50,
      top: 24,
      range: range.value.map(date => format(date, 'yyyy-MM-dd')),
      cellSize: CELL_SIZE,
      splitLine: {
        show: false,
      },
      dayLabel: {
        nameMap: dayMap[config.value.locale] || dayMap['en-US'],
        firstDay: config.value.locale == 'zh-CN' ? 1 : 0,
      },
      monthLabel: {
        show: false,
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
        if (value == 0)
          return ''

        return `<div style="margin-bottom: 6px;">
                  <span>${dateText}</span>
                </div>
                <div>
                  <div style="display: flex; align-items: center;">
                    ${buildMarker(params.color)}
                    <div style="min-width: 40px; flex-grow: 1;"></div>
                    <span style="font-size:14px;color:#666;font-weight:900">${formatHHmmss(value)}</span>
                  </div>
                </div>
                `
      },
      position,
      extraCssText: 'max-width:60%;',
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: calendarList.value,
    },
  }
})

watch(() => props.data, refresh, {
  deep: true,
  immediate: true,
})

watchDebounced(width, async (v) => {
  const week = ~~((v - 70) / CELL_SIZE)
  day.value = week * 7 + getDay(new Date())
  await refresh()
}, {
  debounce: 300,
  immediate: true,
})
</script>

<template>
  <vue-echarts ref="chartRef" :option="option" autoresize :theme="theme" />
</template>
