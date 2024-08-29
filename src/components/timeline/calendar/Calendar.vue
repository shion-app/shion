<script setup lang="ts">
import { startOfMonth } from 'date-fns'

import type { Filter } from '../types'
import type { ActiveStatusMap, CalendarMonthType } from './types'
import { useAdapter } from './useAdapter'

const props = defineProps<{
  date: Date
  category: Filter['category']
  id: Filter['id']
}>()

const { date: dateVModel } = useVModels(props)
const { historyAdapter, labelAdapter, monitorAdapter, planAdapter, momentAdapter } = useAdapter()

let generatedYear = new Date().getFullYear()

const list = ref<Array<CalendarMonthType>>([])
const currentYear = ref(new Date().getFullYear())
const [isMonthMode, toggleMode] = useToggle(true)

const scrollContainer = ref<HTMLElement>()

const activeStatusMap = computedAsync<ActiveStatusMap>(async () => {
  if (typeof props.id != 'number')
    return new Map()

  const { year: startYear, month: startMonth } = list.value[0]
  const startDate = startOfMonth(new Date().setFullYear(startYear, startMonth - 1))
  const endDate = new Date()
  const start = startDate.getTime()
  const end = endDate.getTime()

  if (props.category == 'plan')
    return await planAdapter(start, end, props.id)

  if (props.category == 'label')
    return await labelAdapter(start, end, props.id)

  if (props.category == 'monitor')
    return await monitorAdapter(start, end, props.id)

  if (props.category == 'history')
    return await historyAdapter(start, end, props.id)

  if (props.category == 'moment')
    return await momentAdapter(start, end, props.id)

  return new Map()
})

const { arrivedState } = useScroll(scrollContainer, {
  offset: { top: 30 },
  throttle: 60,
  onScroll,
})

function generate(year: number) {
  const array: Array<CalendarMonthType> = []
  for (let i = 1; i <= 12; i++) {
    array.push({
      year,
      month: i,
    })
  }
  return array
}

function init() {
  const year = new Date().getFullYear()
  list.value = [...generate(year - 1), ...generate(year)]
  generatedYear = year - 1
}

function onScroll() {
  const { top } = arrivedState
  if (top)
    list.value.unshift(...generate(--generatedYear))
}

init()
</script>

<template>
  <div ref="scrollContainer" h-full overflow-y-auto overflow-x-hidden relative ml-2>
    <template v-if="isMonthMode">
      <month-grid
        v-model:date="dateVModel" v-model:current-year="currentYear" :active-status-map="activeStatusMap"
        :list="list"
      />
    </template>
    <template v-else>
      <year-grid v-model:date="dateVModel" :active-status-map="activeStatusMap" :list="list" />
    </template>
  </div>
  <status-bar-teleport :xs="false">
    <status-bar-button
      :tooltip="isMonthMode ? $t('statusBar.calendar.switch.year') : $t('statusBar.calendar.switch.month')"
      :text="isMonthMode ? $t('statusBar.calendar.month') : $t('statusBar.calendar.year')" icon="i-mdi:calendar-month"
      @click="() => toggleMode()"
    />
  </status-bar-teleport>
</template>
