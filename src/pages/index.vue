<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { subDays } from 'date-fns'

import type { RecentNote } from '@interfaces/database'

const list = ref<Array<RecentNote>>([])

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
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      valueFormatter: formatHHmm,
    },
    legend: {},
    grid: {
      left: '2%',
      right: '2%',
      bottom: '2%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: xAxis,
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          formatter: formatHHmm,
        },
      },
    ],
    series: [
      ...planData,
      ...labelData,
    ],
  } as EChartsOption
})

async function init() {
  list.value = await selectRecentNote()
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
      >
        <div text-6 font-bold>
          {{ date }}
        </div>
        <div>{{ planName }}</div>
        <div>{{ labelName }}</div>
        <div>{{ formatHHmm(totalTime) }}</div>
      </div>
    </div>
    <div class="h-[calc(100vh-1.5rem)]" flex-1 sticky top-0 bg-white>
      <v-chart class="chart" :option="option" autoresize />
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
</template>
