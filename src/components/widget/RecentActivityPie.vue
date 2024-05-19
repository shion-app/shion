<script setup lang="ts">
import { startOfDay, subDays } from 'date-fns'
import type { EChartsOption } from 'echarts'

import { db } from '@/modules/database'
import type { SelectActivity, SelectNote } from '@/modules/database'

const { position } = useEcharts()
const { formatHHmmss } = useDateFns()
const { t } = useI18n()

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const list = computed(() => {
  const total = [...noteList.value.map(i => i.end - i.start), ...activityList.value.map(i => i.end - i.start)].reduce((acc, cur) => acc += cur, 0)

  const map = new Map<string, {
    name: string
    color: string
    value: number
    ratio: number
  }>()
  for (const note of noteList.value) {
    const key = `plan-${note.plan.id}`
    const data = (map.get(key) || {
      name: note.plan.name,
      color: note.plan.color,
      value: 0,
      ratio: 0,
    })
    data.value += note.end - note.start
    data.ratio = data.value / total
    map.set(key, data)
  }
  for (const activity of activityList.value) {
    const key = `program-${activity.program.id}`
    const data = (map.get(key) || {
      name: activity.program.name,
      color: activity.program.color,
      value: 0,
      ratio: 0,
    })
    data.value += activity.end - activity.start
    data.ratio = data.value / total
    map.set(key, data)
  }

  return [...map.values()].sort((a, b) => b.value - a.value)
})

async function init() {
  const end = new Date().getTime()
  const start = subDays(startOfDay(end), 6).getTime()
    ;[noteList.value, activityList.value] = await Promise.all([
    db.note.select({
      start,
      end,
    }),
    db.activity.select({
      start,
      end,
    }),
  ])
}

const option = computed<EChartsOption>(() => {
  return {
    title: {
      text: t('widget.recentActivityPie.title'),
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 30,
      selectedMode: false,
      textStyle: {
        overflow: 'truncate',
        width: 160,
      },
      data: list.value.slice(0, 12).map(({ name }) => name),
    },
    tooltip: {
      borderColor: 'transparent',
      position,
      extraCssText: 'max-width:80%;',
      formatter(params) {
        const { marker, value, name } = params
        const [time, ratio] = value
        return `<div class="flex items-center"><div class="shrink-0">${marker}</div>  <span style="font-size:14px;color:#666;font-weight:400;margin-left:6px" class="text-ellipsis overflow-hidden">${name}</span> <div style="min-width: 10px; flex-grow: 1;"></div> <span style="float:right;font-size:14px;color:#666;font-weight:900;margin-right:4px;">${formatHHmmss(time)}</span><span>(${(ratio * 100).toFixed(1)}%)</span></div>`
      },
    },
    series: [
      {
        type: 'pie',
        itemStyle: {
          borderRadius: 5,
        },
        label: {
          show: false,
        },
        center: ['60%', '50%'],
        data: list.value.map(({ value, name, color, ratio }) => ({
          value: [value, ratio],
          name,
          itemStyle: {
            color,
          },
        })),
      },
    ],
  }
})

init()
</script>

<template>
  <vue-echarts :option="option" autoresize />
</template>
