<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { subDays } from 'date-fns'

import type { RecentNote } from '@interfaces/database'

const { t } = useI18n()
const router = useRouter()

const list = ref<Array<RecentNote>>([])
const planMode = ref(true)
const legendHeight = ref(30)
const chartRef = ref()

const TITLE_HEIGHT = 30
const LEGEND_MARGIN_BOTTOM = 10

const option = computed(() => {
  const xAxis = new Array(7).fill(0).map((_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse()

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
    title: {
      text: t('chart.week.active') as string,
    },
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
    graphic: [
      {
        type: 'text',
        right: '2%',
        top: '1%',
        style: {
          text: t('chart.week.switch'),
          fontSize: 16,
        },
        onclick() {
          planMode.value = !planMode.value
        },
      },
    ],
  } as EChartsOption
})

async function init() {
  list.value = await selectRecentNote()
}

function handleChartRendered() {
  const { chart } = chartRef.value
  legendHeight.value = chart.getViewOfComponentModel(chart.getModel().getComponent('legend')).group.getBoundingRect().height
}

function viewNote(planId: number) {
  router.push({
    path: '/note',
    query: {
      planId,
    },
  })
}

init()
</script>

<template>
  <div v-if="list.length" flex>
    <div class="w-[500px]" space-y-4 p-6>
      <div
        v-for="{ planId, planName, labelId, labelName, date, totalTime } in list" :key="`${planId}-${labelId}`"
        rounded-2
        p-4
        bg-white
        shadow-lg
        hover:shadow-xl
        transition-shadow
        cursor-pointer
        @click="viewNote(planId)"
      >
        <div text-6 font-bold>
          {{ date }}
        </div>
        <div>{{ planName }}</div>
        <div>{{ labelName }}</div>
        <div>{{ formatHHmmss(totalTime) }}</div>
      </div>
    </div>
    <div class="h-[calc(100vh-1.5rem)]" flex-1 sticky top-0 bg-white>
      <v-chart ref="chartRef" class="chart" :option="option" autoresize @rendered="handleChartRendered" />
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
</template>
