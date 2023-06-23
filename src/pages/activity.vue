<script setup lang="ts">
import { isToday } from 'date-fns'
import type { ECharts, EChartsOption, SeriesOption } from 'echarts'
import DatePicker from 'ant-design-vue/es/date-picker/date-fns'

import type { Activity } from '@interfaces/index'

const { t } = useI18n()

const store = useActivity()
const { activityList } = storeToRefs(store)

const chartRef = ref<ECharts>()
const date = ref(new Date())
const isDateToday = computed(() => isToday(date.value))
const queryActivityList = ref<Activity[]>([])
const hoverData = ref({
  seriesName: '',
  time: 0,
  spend: 0,
})

const showList = computed(() => isDateToday.value ? activityList.value : queryActivityList.value)

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
    seriesMap.set(path.toLowerCase(), {
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
      ;(series.data as unknown[]).push([last.time, last.time - base], [current.time, last.time - base], '-')
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

function handleMousemove(params) {
  const { event, seriesName } = params
  const pointInPixel = [event.offsetX, event.offsetY]
  const [x] = chartRef.value!.convertFromPixel('grid', pointInPixel)
  const index = showList.value.findIndex(i => i.time >= x)
  const spend = index === 0 ? 0 : showList.value[index].time - showList.value[index - 1].time
  hoverData.value = {
    seriesName,
    time: x,
    spend,
  }
}

watch(date, async (v) => {
  queryActivityList.value = await selectActivity(v)
})
</script>

<template>
  <div h-full relative>
    <div absolute z-1 left-2 top-2>
      <DatePicker v-model:value="date" />
    </div>
    <v-chart ref="chartRef" :option="option" autoresize @mousemove="handleMousemove" />
  </div>
</template>
