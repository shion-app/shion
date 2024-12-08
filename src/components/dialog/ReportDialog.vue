<script setup lang="ts">
import { addDays, endOfMonth, endOfWeek, endOfYear, isBefore, isSameDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns'
import { type Report, generate } from '@/modules/report'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', start: number, end: number): void
}>()

const { visible: visibleVModel } = useVModels(props)
const { t } = useI18n()

enum SelectType {
  Week,
  Month,
  Year,
  Custom,
}

const selectType = ref(SelectType.Week)
const range = ref<[Date, Date]>([new Date(), new Date()])
const dateRange = ref<Array<Date> | null>(null)
const loading = ref(false)
const report = ref<Report>({
  orderProgramList: [],
  orderLabelList: [],
  orderDomainList: [],
  successiveActivity: {},
  successiveNote: {},
})

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
  emit('submit', start, end)
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

watchImmediate(selectType, (v) => {
  const today = new Date()
  switch (v) {
    case SelectType.Week:
      range.value = [startOfWeek(today), endOfWeek(today)]
      break
    case SelectType.Month:
      range.value = [startOfMonth(today), endOfMonth(today)]
      break
    case SelectType.Year:
      range.value = [startOfYear(today), endOfYear(today)]
      break
  }
  dateRange.value = transformRangeToModel(...range.value)
})

watchDeep(dateRange, (v) => {
  const list = v || []
  if (list.length > 1)
    range.value = [list[0], list[list.length - 1]]
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.report')">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <v-list lines="two">
        <v-list-item :title="$t('report.select.title')">
          <template #append>
            <v-select v-model="selectType" :items="selectOptions" hide-details color="primary" class="w-[250px]" />
          </template>
        </v-list-item>
        <v-list-item :title="$t('report.range.title')" :disabled="selectType != SelectType.Custom">
          <template #append>
            <div class="w-[250px]">
              <v-date-input
                v-model="dateRange" multiple="range" :prepend-icon="undefined" hide-details
                color="primary"
              />
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" :loading="loading" @click="submit">
        {{ $t('report.generate') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
</template>
