<script setup lang="ts">
import type { EChartsOption, SeriesOption } from 'echarts'

const { t } = useI18n()

const store = useActivity()
const { activityList } = storeToRefs(store)

const IDLE = 'idle'

const option = computed(() => {
  let base = 0

  const seriesMap = new Map<string, SeriesOption>()

  ;[{
    path: IDLE,
    name: t('activity.idle'),
  }, ...activityList.value.map(({ programPath, programDescription }) => {
    return {
      path: programPath,
      name: programDescription,
    }
  })].forEach(({ path, name }) => {
    seriesMap.set(path.toLowerCase(), {
      name,
      type: 'line',
      symbol: 'none',
      data: [],
      areaStyle: {},
    })
  })

  for (let i = 0; i < activityList.value.length; i++) {
    const current = activityList.value[i]
    const last = activityList.value[i - 1]
    if (base == 0)
      base = current.time
    if (last && !isCaseInsensitivePathEqual(last.programPath, current.programPath)) {
      const series = seriesMap.get(IDLE)!;
      (series.data as unknown[]).push([last.time, last.time - base], [current.time, last.time - base], '-')
      seriesMap.set(IDLE, series)
      base += current.time - last.time
    }

    const key = current.programPath.toLowerCase()

    const series = seriesMap.get(key)!;
    (series.data as unknown[]).push([current.time, current.time - base])

    if (!current.active)
      (series.data as unknown[]).push('-')

    seriesMap.set(key, series)
  }

  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: formatHHmm,
    },
    title: {
      left: 'center',
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: formatHHmm,
      },
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
  <v-chart :option="option" autoresize />
</template>
