<script setup lang="ts">
import type { Activity } from '@interfaces/index'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  showList: Array<Activity>
}>()

const { showList } = toRefs(props)

const option = computed(() => {
  const map = new Map<string, number>()
  for (let i = 0, j = i; i < showList.value.length;) {
    const current = showList.value[i]
    const key = pathToKey(current.programPath)
    if (!map.has(key))
      map.set(key, 0)
    while (showList.value[j] && isPathEqual(showList.value[j].programPath, current.programPath)) {
      if (!showList.value[j].active) {
        const spend = showList.value[j].time - current.time
        const total = map.get(key)! + spend
        map.set(key, total)
        i = ++j
        break
      }
      j++
    }
  }

  const xAxis = [...new Set(showList.value.map(({ programDescription }) => programDescription))]

  const data = sortObjectsByKey(xAxis.map((desc) => {
    const activity = showList.value.find(i => i.programDescription == desc)!
    const key = pathToKey(activity.programPath)
    return {
      description: activity.programDescription,
      spend: map.get(key)!,
    }
  }), 'spend')

  return {
    xAxis: {
      type: 'category',
      data: data.map(({ description }) => description),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: formatHHmmss,
      },
    },
    tooltip: {
      valueFormatter: formatHHmmss,
    },
    series: [
      {
        data: data.map(({ spend }) => spend),
        type: 'bar',
      },
    ],
  } as EChartsOption
})
</script>

<template>
  <v-chart :option="option" autoresize />
</template>
