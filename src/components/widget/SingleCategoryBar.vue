<script setup lang="ts">
import { isSameDay, subDays } from 'date-fns'
import type { EChartsOption } from 'echarts'

import { type SelectActivity, type SelectNote, type SelectOverview, db } from '@/modules/database'

const props = defineProps<{
  data: SelectOverview['data']
}>()

const { format, formatHHmmss } = useDateFns()

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const day = 30
const range = generateRange(day)

const list = computed(() => {
  return noteList.value.length > 0
    ? splitByDay(noteList.value, range).map(i => ({
      start: i.start,
      end: i.end,
      name: i.plan.name,
      color: i.plan.color,
    }))
    : splitByDay(activityList.value, range).map(i => ({
      start: i.start,
      end: i.end,
      name: i.program.name,
      color: i.program.color,

    }))
})

const title = computed(() => props.data.widget?.title as string)
const color = computed(() => props.data.widget?.color as string)

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
  }
  if (table == db.note.table)
    noteList.value = await db.note.select(condition)

  else if (table == db.activity.table)
    activityList.value = await db.activity.select(condition)
}

const option = computed<EChartsOption>(() => {
  const x = new Array(day).fill(0).map((_, i) => subDays(new Date(), i).getTime()).reverse()
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
        const chart = params.filter(({ value }) => value != 0).map(({ marker, value, axisValue }) => {
          return `<div style="margin-bottom: 6px;">${format(new Date(Number(axisValue)), 'MM-dd')}</div> ${marker} <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${formatHHmmss(value)}</span>`
        }).join('')
        return chart
      },
    },
    xAxis: {
      type: 'category',
      data: x,
      axisLabel: {
        formatter: time => format(new Date(Number(time)), 'MM-dd'),
      },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          formatter: formatHHmmss,
        },
        splitNumber: 3,
      },
    ],
    grid: {
      top: 40,
      right: 10,
      bottom: 0,
      left: 10,
      containLabel: true,
    },
    series: {
      type: 'bar',
      data: x.map(date => calcTotalTime(list.value.filter(({ start }) => isSameDay(date, start)))),
      itemStyle: {
        color: color.value,
      },
    },
  }
})

watch(() => props.data, init, {
  deep: true,
  immediate: true,
})
</script>

<template>
  <vue-echarts :option="option" autoresize />
</template>
