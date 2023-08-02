<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { subDays } from 'date-fns'

import type { RecentNote } from '@interfaces/index'

const props = defineProps<{
  list: Array<RecentNote>
  day: number
  chartMode: 'plan' | 'label'
}>()

const { list, day } = toRefs(props)

const legendHeight = ref(30)
const chartRef = ref()

const TITLE_HEIGHT = 30
const LEGEND_MARGIN_BOTTOM = 10

const option = computed(() => {
  const xAxis = new Array(day.value).fill(0).map((_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse()

  const planList = [...new Set(list.value.map(({ planName }) => planName))]

  const planData = planList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: 'plan',
      data: xAxis.map(date => list.value.filter(i => i.planName == name && date == i.date).reduce((acc, cur) => acc += cur.totalTime, 0)),
      itemStyle: {
        color: list.value.find(i => i.planName == name)!.planColor,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  const labelList = [...new Set(list.value.map(({ labelName }) => labelName))]

  const labelData = labelList.map((name) => {
    return {
      name,
      type: 'bar',
      stack: 'label',
      data: xAxis.map(date => list.value.filter(i => i.labelName == name && date == i.date).reduce((acc, cur) => acc += cur.totalTime, 0)),
      itemStyle: {
        color: list.value.find(i => i.labelName == name)!.labelColor,
      },
      emphasis: {
        focus: 'series',
      },
    }
  })

  return {
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
    xAxis: [
      {
        type: 'category',
        data: xAxis.map(i => format(new Date(i), 'MM-dd')),
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          formatter: formatHHmmss,
        },
      },
    ],
    series: props.chartMode == 'plan' ? planData : labelData,
  } as EChartsOption
})

function handleChartRendered() {
  const { chart } = chartRef.value
  legendHeight.value = chart.getViewOfComponentModel(chart.getModel().getComponent('legend')).group.getBoundingRect().height
}
</script>

<template>
  <v-chart ref="chartRef" class="chart" :option="option" autoresize @rendered="handleChartRendered" />
</template>
