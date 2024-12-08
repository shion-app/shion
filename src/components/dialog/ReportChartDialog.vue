<script setup lang="ts">
import type { Report } from '@/modules/report'
import { generate } from '@/modules/report'

const props = defineProps<{
  visible: boolean
  start: number
  end: number
}>()

const { visible: visibleVModel } = useVModels(props)
const { theme } = useEcharts()
const { formatHHmmss, formatYYYYmmdd } = useDateFns()
const { t } = useI18n()

const report = ref<Report>({
  orderProgramList: [],
  orderLabelList: [],
  orderDomainList: [],
  successiveNote: {},
  successiveActivity: {},
})

const programList = computed(() => report.value.orderProgramList.map(({ name, color, totalTime }) => ({ name, color, data: totalTime })))
const labelList = computed(() => report.value.orderLabelList.map(({ name, color, totalTime }) => ({ name, color, data: totalTime })))

const programBar = computed(() => getBarOption(t('reportChart.title.program'), programList.value))
const labelBar = computed(() => getBarOption(t('reportChart.title.label'), labelList.value))
const title = computed(() => `${t('titleBar.view.report')} (${formatYYYYmmdd(props.start)} - ${formatYYYYmmdd(props.end)})`)

function getBarOption(title: string, list: Array<{
  name: string
  data: number
  color: string
}>) {
  while (list.length < 8) {
    list.push({
      name: '',
      data: 1,
      color: '',
    })
  }
  // log轴添加最小值，增强对比
  list.push({
    name: '',
    data: 1,
    color: '',
  })
  return {
    title: {
      text: title,
    },
    grid: {
      left: 10,
      top: 30,
      bottom: 10,
      right: 0,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: list.map(({ name }) => name),
      axisLabel: {
        rotate: 300,
        overflow: 'truncate',
        width: 100,
      },
    },
    yAxis: {
      type: 'log',
      axisLabel: {
        show: false,
      },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 100,
        data: list.map(({ data, color }) => ({
          value: data,
          itemStyle: {
            color,
          },
        })),
      },
    ],
    tooltip: {
      borderColor: 'transparent',
      // position,
      extraCssText: 'max-width:80%;',
      formatter(params) {
        const { value, marker, name } = params
        return `
          <div class="flex items-center">
            <div class="shrink-0">${marker}</div>
            <span style="font-size:14px;color:#666;font-weight:400;margin-left:6px" class="text-ellipsis overflow-hidden">${name}</span>
            <div style="min-width: 40px; flex-grow: 1;"></div>
            <span>${formatHHmmss(value)}</span>
          </div>
        `
      },
    },
  }
}

function save() {

}

whenever(visibleVModel, async () => {
  report.value = await generate(props.start, props.end)
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="title" class="w-[80%]!">
    <v-card-text class="sm:max-h-[500px] space-y-4" overflow-y-auto>
      <vue-echarts v-if="programList.length" class="h-[240px]" :option="programBar" autoresize :theme="theme" />
      <vue-echarts v-if="labelList.length" class="h-[240px]" :option="labelBar" autoresize :theme="theme" />
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="save">
        {{ $t('reportChart.save') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
</template>
