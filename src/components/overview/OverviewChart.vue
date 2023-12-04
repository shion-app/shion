<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { addDays, isAfter, isSameDay, isSameHour, startOfDay, startOfHour, subDays } from 'date-fns'

import type { SelectActivity, SelectNote } from '@/modules/database'

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

const TITLE_HEIGHT = 60
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
      result.push({
        ...data,
        start: timeList[i],
        end: timeList[i + 1],
      })
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
      result.push({
        ...data,
        start: timeList[i],
        end: timeList[i + 1],
      })
    }
    return result
  })
}

function calcTotalTime(list: Array<{ time: number }>) {
  return list.reduce((acc, cur) => acc += cur.time, 0)
}

function getChartData(xAxis: string[], list: Array<TimeRange & { name: string }>) {
  const data: Array<Array<{
    name: string
    time: number
  }>> = new Array(xAxis.length).fill(0).map(() => [])

  for (const item of list) {
    const index = xAxis.findIndex(time => unitVModel.value == 'date' ? isSameDay(new Date(time).getTime(), item.start) : isSameHour(new Date(selectedDate.value).setHours(Number(time)), item.start))
    data[index].push({
      name: item.name,
      time: item.end - item.start,
    })
  }
  return data
}

const x = computed(() => unitVModel.value == 'date'
  ? new Array(day.value).fill(0).map((_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse()
  : new Array(24).fill(0).map((_, i) => `${i}`))

const option = computed(() => {
  const range = [startOfDay(addDays(new Date(), 1 - day.value)), startOfDay(addDays(new Date(), 1))] as [Date, Date]
  const transformNoteList = unitVModel.value == 'date' ? splitByDay(noteList.value, range) : splitByHour(noteList.value.filter(i => isSameDay(new Date(selectedDate.value), i.start)))
  const transformactivityList = unitVModel.value == 'date' ? splitByDay(activityList.value, range) : splitByHour(activityList.value.filter(i => isSameDay(new Date(selectedDate.value), i.start)))

  const planNameList = [...new Set(transformNoteList.map(i => i.plan.name))]

  const planData = getChartData(x.value, transformNoteList.map(i => ({
    name: i.plan.name,
    start: i.start,
    end: i.end,
  })))

  const planSeries = planNameList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: 'plan',
      data: x.value.map((_, index) => calcTotalTime(planData[index].filter(i => i.name == name))),
      itemStyle: {
        color: transformNoteList.find(i => i.plan.name == name)!.plan.color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const labelNameList = [...new Set(transformNoteList.map(i => i.label.name))]

  const labelData = getChartData(x.value, transformNoteList.map(i => ({
    name: i.label.name,
    start: i.start,
    end: i.end,
  })))

  const labelSeries = labelNameList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: 'label',
      data: x.value.map((_, index) => calcTotalTime(labelData[index].filter(i => i.name == name))),
      itemStyle: {
        color: transformNoteList.find(i => i.label.name == name)!.label.color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const programNameList = [...new Set(transformactivityList.map(i => i.program.name))]

  const programData = getChartData(x.value, transformactivityList.map(i => ({
    name: i.program.name,
    start: i.start,
    end: i.end,
  })))

  const programSeries = programNameList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: props.mode,
      data: x.value.map((_, index) => calcTotalTime(programData[index].filter(i => i.name == name))),
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
    series: [...(props.mode == 'plan' ? planSeries : labelSeries), ...programSeries],
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
