<script setup lang="ts">
import { isSameDay, isSameHour } from 'date-fns'
import { db } from '@/modules/database'
import type { SelectActivity, SelectLabel, SelectNote, SelectOverview, SelectProgram } from '@/modules/database'

const props = defineProps<{
  selectedDate: Date
  data: SelectOverview['data']
}>()

const { selectedDate: selectedDateVModel } = useVModels(props)

const { formatHHmmss, formatYYYYmmdd } = useDateFns()
const { position } = useEcharts()

const noteList = ref<Array<SelectNote>>([])
const labelList = ref<Array<SelectLabel>>([])
const activityList = ref<Array<SelectActivity>>([])
const programList = ref<Array<SelectProgram>>([])

const x = new Array(24).fill(0).map((_, i) => i)

const vertical = computed(() => props.data.fields?.vertical || false)

const option = computed(() => {
  const transformNoteList = splitByHour(noteList.value).filter(i => isSameDay(selectedDateVModel.value, i.start))
  const transformactivityList = splitByHour(activityList.value).filter(i => isSameDay(selectedDateVModel.value, i.start))

  const labelData = labelList.value.map(({ id, name }) => {
    return {
      name,
      type: 'bar',
      stack: 'label',
      data: x.map(time => calcTotalTime(transformNoteList.filter(i => i.label.id == id && (isSameHour(new Date(selectedDateVModel.value).setHours(time), i.start))))),
      itemStyle: {
        color: transformNoteList.find(i => i.label.id == id)?.label.color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const programData = programList.value.map(({ id, name }) => {
    return {
      name,
      type: 'bar',
      stack: 'label',
      data: x.map(time => calcTotalTime(transformactivityList.filter(i => i.program.id == id && (isSameHour(new Date(selectedDateVModel.value).setHours(time), i.start))))),
      itemStyle: {
        color: transformactivityList.find(i => i.program.id == id)?.program.color,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const xAxisData = x.map(complement)

  const xAxis = [
    {
      type: 'category',
      data: vertical.value ? xAxisData.reverse() : xAxisData,
    },
  ]

  const yAxis = [
    {
      type: 'value',
      axisLabel: {
        formatter: formatHHmmss,
      },
      splitNumber: 3,
    },
  ]

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
          return `<div class="flex items-center"><div class="shrink-0">${marker}</div>  <span style="font-size:14px;color:#666;font-weight:400;margin-left:6px" class="text-ellipsis overflow-hidden">${seriesName}</span> <div style="min-width: 40px; flex-grow: 1;"></div> <span style="float:right;font-size:14px;color:#666;font-weight:900">${formatHHmmss(value)}</span></div>`
        }).join('')
      },
      position,
      extraCssText: 'max-width:60%;',
    },
    grid: {
      top: 36,
      right: vertical.value ? 30 : 10,
      bottom: 0,
      left: 10,
      containLabel: true,
    },
    xAxis: (vertical.value ? yAxis : xAxis) as any,
    yAxis: (vertical.value ? xAxis : yAxis) as any,
    series: [...labelData, ...programData],
  }
})

async function init(date: Date) {
  const range = generateRange(1, date)
  const [start, end] = range.map(date => date.getTime())
    ;[noteList.value, activityList.value, labelList.value, programList.value] = await Promise.all([
    db.note.select({
      start,
      end,
    }),
    db.activity.select({
      start,
      end,
    }),
    db.label.select(),
    db.program.select(),
  ])
}

watchImmediate(selectedDateVModel, init)
</script>

<template>
  <vue-echarts :option="option" autoresize />
</template>
