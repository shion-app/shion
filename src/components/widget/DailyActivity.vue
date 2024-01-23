<script setup lang="ts">
import { isSameHour } from 'date-fns'
import { type SelectActivity, type SelectNote, db } from '@/modules/database'

const props = defineProps<{
  selectedDate: Date
}>()

const { selectedDate: selectedDateVModel } = useVModels(props)

const { formatHHmmss, formatYYYYmmdd } = useDateFns()
const { position } = useEcharts()

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const x = new Array(24).fill(0).map((_, i) => i)

const option = computed(() => {
  const transformNoteList = splitByHour(noteList.value)
  const transformactivityList = splitByHour(activityList.value)

  const labelList = [...new Set(transformNoteList.map(i => i.label.name))]

  const labelData = labelList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: 'label',
      data: x.map(time => calcTotalTime(transformNoteList.filter(i => i.label.name == name && (isSameHour(new Date(selectedDateVModel.value).setHours(time), i.start))))),
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
      stack: 'label',
      data: x.map(time => calcTotalTime(transformactivityList.filter(i => i.program.name == name && (isSameHour(new Date(selectedDateVModel.value).setHours(time), i.start))))),
      itemStyle: {
        color: transformactivityList.find(i => i.program.name == name)!.program.color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  return {
    title: {
      text: formatYYYYmmdd(selectedDateVModel.value),
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        return params.filter(({ value }) => value != 0).sort((a, b) => b.value - a.value).map(({ marker, seriesName, value }) => {
          return `${marker}  <span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${seriesName}</span>  <span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${formatHHmmss(value)}</span>`
        }).join('<br/>')
      },
      position,
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '2%',
      top: 36,
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: x.map(complement),
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          formatter: formatHHmmss,
        },
        splitNumber: 3,
      },
    ],
    series: [...labelData, ...programData],
  }
})

async function init(date: Date) {
  const range = generateRange(1, date)
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

watchImmediate(selectedDateVModel, init)
</script>

<template>
  <vue-echarts :option="option" autoresize />
</template>