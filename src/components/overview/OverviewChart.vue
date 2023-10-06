<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { addDays, isAfter, isSameDay, isSameHour, startOfDay, startOfHour, subDays } from 'date-fns'

import type { SelectActivity, SelectNote } from '@modules/database'

const props = defineProps<{
  noteList: Array<SelectNote>
  activityList: Array<SelectActivity>
  day: number
  mode: 'plan' | 'label'
  unit: 'date' | 'hour'
}>()

const { noteList, day, activityList } = toRefs(props)

const { unit: unitVModel } = useVModels(props)

const legendHeight = ref(30)
const chartRef = ref()
const selectedDate = ref('')
const selectedComponentIndex = ref(-1)

const TITLE_HEIGHT = 30
const LEGEND_MARGIN_BOTTOM = 10

interface TimeRange {
  start: number
  end: number
}

function splitByDay<T extends TimeRange>(list: T[], range: [Date, Date]) {
  return list.flatMap((data) => {
    const { start, end } = data
    const [startDate, endDate] = range
    let _start = isAfter(start, startDate) ? new Date(start) : startDate
    const timeList: Array<number> = [_start.getTime()]
    _start = startOfDay(addDays(_start, 1))
    while (isAfter(end, _start)) {
      timeList.push(_start.getTime())
      _start = addDays(_start, 1)
    }

    timeList.push(isAfter(endDate, end) ? end : endDate.getTime())
    const result: T[] = []
    for (let i = 0; i < timeList.length - 1; i++) {
      result.push(Object.assign({}, data, {
        start: timeList[i],
        end: timeList[i + 1],
      }))
    }
    return result
  })
}

function splitByHour<T extends TimeRange>(list: T[]) {
  return list.flatMap((data) => {
    const { start, end } = data
    const startHour = new Date(start).getHours()
    const endHour = isSameDay(start, end) ? new Date(end).getHours() : 23
    const timeList: Array<number> = [start]
    for (let i = startHour + 1; i <= endHour; i++) {
      const date = startOfHour(new Date(start).setHours(i))
      const time = date.getTime()
      if (time > end)
        break

      else
        timeList.push(time)
    }
    timeList.push(isSameDay(start, end) ? end : new Date(startOfDay(addDays(start, 1))).getTime())
    const result: T[] = []
    for (let i = 0; i < timeList.length - 1; i++) {
      result.push(Object.assign({}, data, {
        start: timeList[i],
        end: timeList[i + 1],
      }))
    }
    return result
  })
}

function calcTotalTime(list: Array<TimeRange>) {
  return list.reduce((acc, cur) => acc += cur.end - cur.start, 0)
}

const x = computed(() => unitVModel.value == 'date'
  ? new Array(day.value).fill(0).map((_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse()
  : new Array(24).fill(0).map((_, i) => `${i}`))

const option = computed(() => {
  const range = [startOfDay(addDays(new Date(), 1 - day.value)), startOfDay(addDays(new Date(), 1))] as [Date, Date]
  let transformNoteList = splitByDay(noteList.value, range)
  let transformactivityList = splitByDay(activityList.value, range)
  transformNoteList = unitVModel.value == 'date' ? transformNoteList : splitByHour(transformNoteList.filter(i => isSameDay(new Date(selectedDate.value), i.start)))
  transformactivityList = unitVModel.value == 'date' ? transformactivityList : splitByHour(transformactivityList.filter(i => isSameDay(new Date(selectedDate.value), i.start)))

  const planList = [...new Set(transformNoteList.map(i => i.plan.name))]

  const planData = planList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: 'plan',
      data: x.value.map(time => calcTotalTime(transformNoteList.filter(i => i.plan.name == name && (unitVModel.value == 'date' ? isSameDay(new Date(time).getTime(), i.start) : isSameHour(new Date(selectedDate.value).setHours(Number(time)), i.start))))),
      itemStyle: {
        color: transformNoteList.find(i => i.plan.name == name)!.plan.color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const labelList = [...new Set(transformNoteList.map(i => i.label.name))]

  const labelData = labelList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: 'label',
      data: x.value.map(time => calcTotalTime(transformNoteList.filter(i => i.label.name == name && (unitVModel.value == 'date' ? isSameDay(new Date(time).getTime(), i.start) : isSameHour(new Date(selectedDate.value).setHours(Number(time)), i.start))))),
      itemStyle: {
        color: transformNoteList.find(i => i.label.name == name)!.label.color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const programList = [...new Set(transformactivityList.map(i => i.program.name))]

  const programData = programList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: props.mode == 'plan' ? 'plan' : 'label',
      data: x.value.map(time => calcTotalTime(transformactivityList.filter(i => i.program.name == name && (unitVModel.value == 'date' ? isSameDay(new Date(time).getTime(), i.start) : isSameHour(new Date(selectedDate.value).setHours(Number(time)), i.start))))),
      itemStyle: {
        color: transformactivityList.find(i => i.program.name == name)!.program.color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const xAxis = unitVModel.value == 'date'
    ? [
        {
          type: 'category',
          data: x.value.map(i => format(new Date(i), 'MM-dd')),
        },
      ]
    : [
        {
          type: 'category',
          data: x.value.map(i => complement(Number(i))),
        },
      ]

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        const date = unitVModel.value == 'date' ? '' : selectedDate.value
        const chart = params.filter(({ value }) => value != 0).sort((a, b) => b.value - a.value).map(({ marker, seriesName, value, componentIndex }) => {
          const opacity = [-1, componentIndex].includes(selectedComponentIndex.value) ? 1 : 0.3
          return `<div style="opacity: ${opacity}">${marker}  <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${seriesName}</span>  <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${formatHHmmss(value)}</span></div>`
        }).join('')
        return chart ? date + chart : ''
      },
    },
    legend: {
      top: TITLE_HEIGHT,
      height: legendHeight.value,
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '2%',
      top: legendHeight.value + TITLE_HEIGHT + LEGEND_MARGIN_BOTTOM,
      containLabel: true,
    },
    xAxis,
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          formatter: formatHHmmss,
        },
      },
    ],
    series: [...(props.mode == 'plan' ? planData : labelData), ...programData],
  } as EChartsOption
})

function handleChartRendered() {
  const { chart } = chartRef.value
  legendHeight.value = chart.getViewOfComponentModel(chart.getModel().getComponent('legend')).group.getBoundingRect().height
}

function handleChartClick(event) {
  if (unitVModel.value == 'hour')
    return

  const { dataIndex } = event
  selectedDate.value = x.value[dataIndex]
  unitVModel.value = 'hour'
  resetSelectedComponentIndex()
}

function handleChartMouseOver(event) {
  const { componentIndex } = event
  selectedComponentIndex.value = componentIndex
}

function resetSelectedComponentIndex() {
  selectedComponentIndex.value = -1
}

function handleChartMouseOut() {
  resetSelectedComponentIndex()
}
</script>

<template>
  <v-chart
    ref="chartRef" class="chart" :option="option" autoresize @rendered="handleChartRendered"
    @click="handleChartClick"
    @mouseover="handleChartMouseOver"
    @mouseout="handleChartMouseOut"
  />
</template>
