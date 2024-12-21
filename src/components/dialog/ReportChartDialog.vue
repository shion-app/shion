<script setup lang="ts">
import html2canvas from 'html2canvas'
import { save as saveDialog } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'

import type { Report } from '@/modules/report'
import { generate } from '@/modules/report'
import qrcode from '@/assets/qrcode.png'

interface Item {
  name: string
  value: number
  color: string
  image?: string
  id?: number
}

const props = defineProps<{
  visible: boolean
  start: number
  end: number
}>()

const IGNORE_VALUE = 1

const { visible: visibleVModel } = useVModels(props)
const { theme } = useEcharts()
const { formatHHmmss, formatYYYYmmdd } = useDateFns()
const { t } = useI18n()
const { success, error } = useNotify()

const report = ref<Report>({
  orderProgramList: [],
  orderLabelList: [],
  orderDomainList: [],
  successiveNote: {},
  successiveActivity: {},
})
const loading = ref(false)
const chart = ref<ComponentPublicInstance>()

const programList = computed(() => report.value.orderProgramList.map(({ name, color, totalTime, icon, id }) => ({ name, color, value: totalTime, image: icon, id })))
const labelList = computed(() => report.value.orderLabelList.map(({ name, color, totalTime, id }) => ({ name, color, value: totalTime, id })))
const domainList = computed(() => report.value.orderDomainList.map(({ name, color, itemCount, id }) => ({ name, color, value: itemCount, id })))
const overviewList = computed(() => [...programList.value, ...labelList.value].sort((a, b) => b.value - a.value))

const programBar = computed(() => getBarOption(programList.value, list => t('reportChart.title.program') + getTotalTime(list), formatHHmmss))
const labelBar = computed(() => getBarOption(labelList.value, list => t('reportChart.title.label') + getTotalTime(list), formatHHmmss))
const domainBar = computed(() => getBarOption(domainList.value, list => t('reportChart.title.domain') + getTotalCount(list), visit => t('reportChart.title.visit', {
  visit,
})))
const overviewPipe = computed(() => getPipeOption(overviewList.value))

const range = computed(() => `${formatYYYYmmdd(props.start, {
  year: true,
})} - ${formatYYYYmmdd(props.end, {
  year: true,
})}`)

function getTotalTime(list: Array<Item>) {
  const text = formatHHmmss(list.reduce((acc, cur) => acc += cur.value, 0))
  return ` (${text})`
}

function getTotalCount(list: Array<Item>) {
  const text = t('reportChart.title.visit', {
    visit: list.reduce((acc, cur) => acc += cur.value, 0),
  })
  return ` (${text})`
}

function getBarOption(list: Array<Item>, formatTitle: (list: Array<Item>) => string, formatValue: (value: number) => string) {
  list = [...list]
  while (list.length < 8) {
    list.push({
      name: '',
      value: IGNORE_VALUE,
      color: '',
    })
  }
  // log轴添加最小值，增强对比
  list.push({
    name: '',
    value: IGNORE_VALUE,
    color: '',
  })
  const hasImage = list.some(i => i.image)
  return {
    title: {
      text: formatTitle(list),
    },
    grid: {
      left: 10,
      top: 40,
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
      ...(hasImage
        ? [
            {
              type: 'bar',
              stack: 'bar',
              barMaxWidth: 100,
              data: list.filter(({ id }) => id).map(({ color }) => ({
              // 展示label图片，稍微偏大一点
                value: IGNORE_VALUE + 0.0001,
                itemStyle: {
                  color,
                },
              })),
              label: {
                show: true,
                position: 'outside',
                formatter: ({ value, dataIndex }) => value <= IGNORE_VALUE ? '' : `{${list[dataIndex].id}|}`,
                rich: Object.fromEntries(list.filter(({ id }) => id).map(({ id, image: src }) => {
                  const image = new Image()
                  image.crossOrigin = 'anonymous'
                  if (src)
                    image.src = src

                  return [id, {
                    height: 16,
                    width: 16,
                    backgroundColor: {
                      image,
                    },
                  }]
                })),
              },
            },
          ]
        : []),
      {
        type: 'bar',
        stack: 'bar',
        barMaxWidth: 100,
        data: list.map(({ value, color }) => ({
          value,
          itemStyle: {
            color,
          },
        })),
        label: {
          show: true,
          position: 'top',
          formatter: ({ value }) => value <= IGNORE_VALUE ? '' : formatValue(value),
          rotate: 300,
          overflow: 'truncate',
          width: 100,
          distance: -20,
        },
      },
    ],
    tooltip: {
      show: !loading.value,
      borderColor: 'transparent',
      extraCssText: 'max-width:80%;',
      formatter(params) {
        const { value, marker, name } = params
        return `
          <div class="flex items-center">
            <div class="shrink-0">${marker}</div>
            <span style="font-size:14px;color:#666;font-weight:400;margin-left:6px" class="text-ellipsis overflow-hidden">${name}</span>
            <div style="min-width: 40px; flex-grow: 1;"></div>
            <span>${formatValue(value)}</span>
          </div>
        `
      },
    },
  }
}

function getPipeOption(list: Array<Item>) {
  return {
    title: {
      text: t('reportChart.title.overview') + getTotalTime(list),
    },
    tooltip: {
      show: !loading.value,
      borderColor: 'transparent',
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
    series: [
      {
        type: 'pie',
        data: list.map(({ name, color, value }) => ({
          value,
          name,
          itemStyle: {
            color,
          },
        })),
      },
    ],
  }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob)
        resolve(blob)
      else
        reject(new Error('Failed to convert canvas to Blob'))
    }, 'image/png')
  })
}

async function save() {
  const selected = await saveDialog({
    defaultPath: `${range.value}.png`,
    filters: [
      {
        name: '',
        extensions: ['png'],
      },
    ],
  })
  if (selected) {
    loading.value = true
    try {
      await nextTick()
      const el = chart.value?.$el as HTMLCanvasElement
      const canvas = await html2canvas(el, {
        width: el.scrollWidth,
        height: el.scrollHeight,
      })
      const blob = await canvasToBlob(canvas)
      const buffer = await blob.arrayBuffer()
      await writeFile(selected, new Uint8Array(buffer))
    }
    catch (e) {
      return error({
        text: (e as any).message as string,
      })
    }
    finally {
      loading.value = false
    }
    success({})
  }
}

watch(visibleVModel, async (v) => {
  if (v) {
    report.value = await generate(props.start, props.end)
  }
  else {
    report.value = {
      orderProgramList: [],
      orderLabelList: [],
      orderDomainList: [],
      successiveNote: {},
      successiveActivity: {},
    }
  }
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.report')" class="w-[80%]!">
    <v-card-text ref="chart" class="sm:max-h-[500px] space-y-4 !pt-0" :class="loading ? '' : 'overflow-y-auto'">
      <div class="text-[26px] font-bold sticky top-0 bg-white z-1 pt-6 pb-4">
        {{ range }}
      </div>
      <vue-echarts v-if="programList.length" class="h-[280px]" :option="programBar" autoresize :theme="theme" />
      <vue-echarts v-if="labelList.length" class="h-[280px]" :option="labelBar" autoresize :theme="theme" />
      <vue-echarts v-if="domainList.length" class="h-[280px]" :option="domainBar" autoresize :theme="theme" />
      <vue-echarts v-if="overviewList.length" class="h-[440px]" :option="overviewPipe" autoresize :theme="theme" />
      <div v-if="loading" class="flex space-x-1 pb-6">
        <div class="flex-1" />
        <div>
          <img :src="qrcode" class="w-[96px] h-[96px] ml-auto">
          <div class="text-sm">
            {{ $t('reportChart.tagline') }}
          </div>
        </div>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" :loading="loading" @click="save">
        {{ $t('reportChart.save') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
</template>
