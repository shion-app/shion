<script setup lang="ts">
import type { Activity } from '@interfaces/index'
import { invoke } from '@tauri-apps/api'
import type { ECharts, EChartsOption, SeriesOption } from 'echarts'

const props = defineProps<{
  showList: Array<Activity>
  isOpenLog: boolean
}>()

const { isOpenLog: isOpenLogVModel } = useVModels(props)
const { showList } = toRefs(props)

const { t } = useI18n()

const chartRef = ref<ECharts>()
const hoverData = ref({
  seriesName: '',
  time: 0,
  spend: 0,
})
const iconMap = ref(new Map<string, string>())

const IDLE = 'idle'

const option = computed(() => {
  let base = 0

  const seriesMap = new Map<string, SeriesOption>()

    ;[{
    path: IDLE,
    name: t('activity.idle'),
  }, ...showList.value.map(({ programPath, programDescription }) => {
    return {
      path: programPath,
      name: programDescription,
    }
  })].forEach(({ path, name }) => {
    seriesMap.set(pathToKey(path), {
      name,
      type: 'line',
      symbol: 'none',
      data: [],
      areaStyle: {},
      clip: false,
      triggerLineEvent: true,
    })
  })

  for (let i = 0; i < showList.value.length; i++) {
    const current = showList.value[i]
    const last = showList.value[i - 1]
    if (base == 0)
      base = current.time
    if (last && ((!last.active && current.active))) {
      const series = seriesMap.get(IDLE)!
        ; (series.data as unknown[]).push([last.time, last.time - base], [current.time, last.time - base], '-')
      seriesMap.set(IDLE, series)
      base += current.time - last.time
    }

    const key = pathToKey(current.programPath)

    const series = seriesMap.get(key)!;
    (series.data as unknown[]).push([current.time, current.time - base])

    if (!current.active)
      (series.data as unknown[]).push('-')

    seriesMap.set(key, series)
  }

  return {
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter(params) {
        const line = params.find(i => i.seriesName == hoverData.value.seriesName)
        if (!line)
          return ''

        const { marker, seriesName } = line
        return `${format(hoverData.value.time, 'HH:mm:ss')}<br/>${marker}  ${seriesName}  ${formatHHmmss(hoverData.value.spend)}`
      },
    },
    title: {
      left: 'center',
    },
    xAxis: {
      type: 'time',
      axisPointer: {
        snap: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: formatHHmmss,
      },
    },
    dataZoom: [
      {
        start: 0,
        end: 100,
        left: 150,
        right: 150,
        filterMode: 'none',
      },
    ],
    legend: {
      top: 50,
    },
    grid: {
      top: 100,
    },
    series: [...seriesMap.values()],
  } as EChartsOption
})

function findActivityRange(index: number) {
  const last = showList.value[index - 1]
  const current = showList.value[index]
  const isIdleRange = current.active && last && !last.active
  if (isIdleRange)
    return [index - 1, index]

  let start = index
  let end = index
  while (showList.value[start]
    && isPathEqual(showList.value[start].programPath, current.programPath)
    && (start == index || showList.value[start].active)
  )
    start--

  while (showList.value[end]
    && isPathEqual(showList.value[end].programPath, current.programPath)
    && showList.value[end].active
  )
    end++

  return [start + 1, end]
}

function handleMousemove(params) {
  const { event, seriesName } = params
  const pointInPixel = [event.offsetX, event.offsetY]
  const [x] = chartRef.value!.convertFromPixel('grid', pointInPixel)
  const index = showList.value.findIndex(i => i.time >= x)
  let spend = 0
  if (index != -1) {
    const [start, end] = findActivityRange(index)
    spend = showList.value[end].time - showList.value[start].time
  }
  hoverData.value = {
    seriesName,
    time: x,
    spend,
  }
}

watch(showList, async (v) => {
  const pathList = [...new Set(v.map(({ programPath }) => programPath))]
  for (const programPath of pathList) {
    const path = programPath.toLocaleLowerCase()
    if (iconMap.value.has(path))
      continue

    const buffer = await invoke<number[]>('get_image_by_path', {
      path: programPath,
    })
    iconMap.value.set(path, URL.createObjectURL(createIconBlob(buffer)))
  }
}, {
  deep: true,
  immediate: true,
})

onUnmounted(() => {
  [...iconMap.value.values()].forEach(url => URL.revokeObjectURL(url))
})
</script>

<template>
  <v-chart ref="chartRef" :option="option" autoresize @mousemove="handleMousemove" />
  <a-drawer v-model:visible="isOpenLogVModel" :closable="false" placement="left" :width="700">
    <div v-for="{ id, programPath, title, time } in showList" :key="id" flex space-x-2 items-center>
      <div>{{ format(time, 'HH:mm:ss') }}</div>
      <img :src="iconMap.get(programPath.toLocaleLowerCase())" width="16" height="16">
      <div truncate :title="title">
        {{ title }}
      </div>
    </div>
  </a-drawer>
</template>
