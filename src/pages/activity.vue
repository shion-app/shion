<script setup lang="ts">
import type { EChartsOption, SeriesOption } from 'echarts'

const monitorStore = useMonitor()
const activityStore = useActivity()
const { whiteList } = storeToRefs(monitorStore)
const { activityList } = storeToRefs(activityStore)

const option = computed(() => {
  let base = 0

  const seriesMap = new Map<number, SeriesOption>()

  ;[{
    id: 0,
    name: 'idle',
  }, ...activityList.value.map(({ programId }) => {
    const program = whiteList.value.find(i => i.id == programId)!
    return {
      id: programId,
      name: program.description,
    }
  })].forEach(({ id, name }) => {
    seriesMap.set(id, {
      name,
      type: 'line',
      symbol: 'none',
      data: [],
    })
  })

  for (let i = 0; i < activityList.value.length; i++) {
    const current = activityList.value[i]
    const last = activityList.value[i - 1]
    if (base == 0)
      base = current.time
    if (last && last.programId != current.programId) {
      // const series = seriesMap.get(0)!;
      // (series.data as number[][]).push([last.time, last.time - base], [current.time, last.time - base])
      // seriesMap.set(0, series)
      base += current.time - last.time
    }

    const series = seriesMap.get(current.programId)!;
    (series.data as number[][]).push([current.time, current.time - base])
    seriesMap.set(current.programId, series)
  }

  return {
    tooltip: {
      trigger: 'axis',
    },
    title: {
      left: 'center',
      text: 'Large Ara Chart',
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, '100%'],
    },
    dataZoom: [
      {
        start: 0,
        end: 100,
      },
    ],
    series: [...seriesMap.values()],
  } as EChartsOption
})
</script>

<template>
  <v-chart v-if="whiteList.length" :option="option" autoresize />
  <a-empty v-else h-full flex flex-col justify-center />
</template>
