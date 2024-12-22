<script setup lang="ts">
import { addDays, endOfMonth, endOfWeek, endOfYear, isBefore, isSameDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns'
import type { Report } from '@/modules/report'
import { generate } from '@/modules/report'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)
const { t } = useI18n()
const configStore = useConfigStore()

const { config } = storeToRefs(configStore)

enum SelectType {
  Week,
  Month,
  Year,
  Custom,
}

const reportChartVisible = ref(false)
const report = ref<Report>({
  orderProgramList: [],
  orderLabelList: [],
  orderDomainList: [],
  // successiveNote: {},
  // successiveActivity: {},
  domainTotalCount: 0,
  labelTotalTime: 0,
  programTotalTime: 0,
})

const selectType = ref(SelectType.Week)
const range = ref<[Date, Date]>([new Date(), new Date()])
const dateRange = ref<Array<Date> | null>(null)
const loading = ref(false)

const selectOptions = computed(() => [
  {
    title: t('report.select.week'),
    value: SelectType.Week,
  },
  {
    title: t('report.select.month'),
    value: SelectType.Month,
  },
  {
    title: t('report.select.year'),
    value: SelectType.Year,
  },
  {
    title: t('report.select.custom'),
    value: SelectType.Custom,
  },
])

async function submit() {
  const [start, end] = range.value.map(date => date.getTime())
  loading.value = true
  report.value = await generate(start, end)
  loading.value = false
  reportChartVisible.value = true
}

function transformRangeToModel(start: Date, end: Date) {
  const list: Array<Date> = []
  for (let i = start; isBefore(i, end); i = addDays(i, 1)) {
    if (!isSameDay(i, end))
      list.push(i)
  }
  list.push(end)

  return list
}

function handleDateRangeUpdated(v) {
  const list = (v as Array<Date> | null) || []
  if (list.length > 1)
    range.value = [list[0], list[list.length - 1]]
}

watchEffect(() => {
  const today = new Date()
  switch (selectType.value) {
    case SelectType.Week: {
      const weekStartsOn = config.value.locale == 'zh-CN' ? 1 : 0
      range.value = [startOfWeek(today, {
        weekStartsOn,
      }), endOfWeek(today, { weekStartsOn })]
      break
    }
    case SelectType.Month:
      range.value = [startOfMonth(today), endOfMonth(today)]
      break
    case SelectType.Year:
      range.value = [startOfYear(today), endOfYear(today)]
      break
  }
  dateRange.value = transformRangeToModel(...range.value)
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.report')">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <v-list lines="two">
        <v-list-item :title="$t('report.select.title')">
          <template #append>
            <v-select v-model="selectType" :items="selectOptions" hide-details color="primary" class="w-[280px]" />
          </template>
        </v-list-item>
        <v-list-item :title="$t('report.range.title')" :disabled="selectType != SelectType.Custom">
          <template #append>
            <div class="w-[280px]">
              <v-date-input
                v-model="dateRange" multiple="range" :prepend-icon="undefined" hide-details color="primary"
                @update:model-value="handleDateRangeUpdated"
              />
            </div>
          </template>
        </v-list-item>
        <div class="flex text-orange items-centr mt-4 space-x-1 text-sm">
          <div class="flex-1" />
          <div class="i-mdi:information text-4 mt-[2px]" />
          <div class=" ">
            {{ $t('report.tip') }}
          </div>
        </div>
      </v-list>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" :loading="loading" @click="submit">
        {{ $t('report.generate') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
  <report-chart-dialog
    v-model:visible="reportChartVisible" v-bind="{
      report,
      start: range[0],
      end: range[1],
    }"
  />
</template>
