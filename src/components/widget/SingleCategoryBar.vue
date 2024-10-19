<script setup lang="ts">
import { isSameDay, isSameYear, subDays } from 'date-fns'

import { type SelectActivity, type SelectNote, type SelectOverview, db } from '@/modules/database'

const props = defineProps<{
  data: SelectOverview['data']
}>()

const { format, formatHHmmss } = useDateFns()
const { position, theme } = useEcharts()

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])
let currentSeriesName = ''

const day = 30
const range = generateRange(day)

const title = computed(() => props.data.widget?.title as string)
const vertical = computed(() => props.data.fields?.vertical || false)

async function init() {
  noteList.value = activityList.value = []
  const { query } = props.data
  if (!query)
    return

  const { table, where } = query
  const [start, end] = range
  const condition = {
    ...where,
    start: start.getTime(),
    end: end.getTime(),
  } as any
  if (table == db.note.table) {
    noteList.value = await db.note.select(condition)
  }
  else if (table == db.activity.table) {
    activityList.value = await db.activity.select(condition)
  }
  else if (table == db.dimension.table) {
    noteList.value = await db.note.selectByDimension(condition)
    activityList.value = await db.activity.selectByDimension(condition)
  }
}

const option = computed(() => {
  const x = new Array(day).fill(0).map((_, i) => subDays(new Date(), i).getTime())
  const xAxisData = vertical.value ? x : x.reverse()

  const transformNoteList = splitByDay(noteList.value, range)
  const transformactivityList = splitByDay(activityList.value, range)

  const labelList = filterUniqueByKey(noteList.value.map(i => i.label), 'id')
  const programList = filterUniqueByKey(activityList.value.map(i => i.program), 'id')

  const labelData = labelList.map(({ id, name, color }) => {
    return {
      name,
      type: 'bar',
      stack: 'label',
      data: xAxisData.map(day => calcTotalTime(transformNoteList.filter(i => i.label.id == id && (isSameDay(new Date(day), i.start))))),
      itemStyle: {
        color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const programData = programList.map(({ id, name, color }) => {
    return {
      name,
      type: 'bar',
      stack: 'label',
      data: xAxisData.map(day => calcTotalTime(transformactivityList.filter(i => i.program.id == id && (isSameDay(new Date(day), i.start))))),
      itemStyle: {
        color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const xAxis = {
    type: 'category',
    data: xAxisData,
    axisLabel: {
      formatter: time => format(new Date(Number(time)), 'MM-dd'),
    },
  }
  const yAxis = {
    type: 'value',
    axisLabel: {
      formatter: formatHHmmss,
    },
    splitNumber: 2,
  }

  return {
    title: {
      text: title.value,
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        const sum = params.reduce((acc, prev) => acc += prev.value, 0)
        if (sum == 0)
          return

        const { axisValue } = params[0]
        const date = new Date(Number(axisValue))
        const dateText = isSameYear(new Date(), date) ? format(date, 'MM-dd') : format(date, 'yyyy-MM-dd')
        const title = `
          <div style="margin-bottom: 6px;">
            <span>${dateText}</span>
            <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${formatHHmmss(sum)}</span>
          </div>`
        const content = params.filter(({ value }) => value != 0).sort((a, b) => b.value - a.value).map(({ marker, seriesName, value }) => {
          return `<div class="flex items-center ${(currentSeriesName.length == 0 || currentSeriesName == seriesName) ? '' : 'opacity-30'}">
              <div class="shrink-0">${marker}</div>
              <span style="font-size:14px;color:#666;font-weight:400;margin-left:6px" class="text-ellipsis overflow-hidden">${seriesName}</span>
              <div style="min-width: 40px; flex-grow: 1;"></div>
              <span>${formatHHmmss(value)}</span>
            </div>`
        }).join('')

        return title + content
      },
      position,
      extraCssText: `max-width:calc(${vertical.value ? 100 : 60}% + 80px);`,
    },
    xAxis: (vertical.value ? yAxis : xAxis) as any,
    yAxis: (vertical.value ? xAxis : yAxis) as any,
    grid: {
      top: 40,
      right: vertical.value ? 30 : 10,
      bottom: 0,
      left: 10,
      containLabel: true,
    },
    series: [...labelData, ...programData],
  }
})

function handleMouseover(event) {
  currentSeriesName = event.seriesName || ''
}

function handleMouseout() {
  currentSeriesName = ''
}

watch(() => props.data, init, {
  deep: true,
  immediate: true,
})
</script>

<template>
  <vue-echarts
    :option="option" autoresize :theme="theme" @mouseover="handleMouseover"
    @mouseout="handleMouseout"
  />
</template>
