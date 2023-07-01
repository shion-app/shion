<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { subDays } from 'date-fns'

import type { RecentNote } from '@interfaces/database'

const { t } = useI18n()

const list = ref<Array<RecentNote>>([])
const planMode = ref(true)
const legendHeight = ref(30)
const chartRef = ref()
const chartType = ref<'month' | 'week'>('week')
const day = computed(() => chartType.value == 'week' ? 7 : 31)

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
      valueFormatter: formatHHmmss,
      // formatter(params) {
      //   return params.filter(({ value }) => value != 0).map(({ marker, seriesName, value }) => {
      //     return `${marker}  ${seriesName}  ${formatHHmmss(value)}`
      //   }).join('<br/>')
      // },
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
    series: planMode.value ? planData : labelData,
  } as EChartsOption
})

async function refresh() {
  list.value = await selectRecentNote(day.value)
}

function handleChartRendered() {
  const { chart } = chartRef.value
  legendHeight.value = chart.getViewOfComponentModel(chart.getModel().getComponent('legend')).group.getBoundingRect().height
}

watch(chartType, refresh, {
  immediate: true,
})
</script>

<template>
  <div class="h-[calc(100vh-1.5rem)]" flex-1 sticky top-0 bg-white relative>
    <a-radio-group v-model:value="chartType" size="small" absolute z-1>
      <a-radio-button value="week">
        <a-tooltip :title="$t('overview.week')">
          <div h-full flex items-center>
            <div i-mdi:view-split-vertical text-4 />
          </div>
        </a-tooltip>
      </a-radio-button>
      <a-radio-button value="month">
        <a-tooltip :title="$t('overview.month')">
          <div h-full flex items-center>
            <div i-mdi:view-split-horizontal text-4 />
          </div>
        </a-tooltip>
      </a-radio-button>
    </a-radio-group>
    <v-chart ref="chartRef" class="chart" :option="option" autoresize @rendered="handleChartRendered" />
  </div>
</template>
