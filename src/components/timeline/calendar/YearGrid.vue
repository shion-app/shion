<script setup lang="ts">
import type { ComponentExposed } from 'vue-component-type-helpers'

import type { ActiveStatusMap, CalendarMonthType } from './types'
import CalendarMonth from './CalendarMonth.vue'

type CalendarMonthExposed = ComponentExposed<typeof CalendarMonth>

const props = withDefaults(defineProps<{
  date: Date
  list: CalendarMonthType[]
  activeStatusMap?: ActiveStatusMap
}>(), {
  activeStatusMap: () => new Map(),
})

const { date: dateVModel } = useVModels(props)
const calendarMonthRef = useTemplateRefsList<CalendarMonthExposed>()

const { locale } = useI18n()
const weekdays = computed(() => locale.value == 'zh-CN' ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])

const yearList = computed(() => {
  const map = new Map<number, CalendarMonthType[]>()
  for (const item of props.list)
    map.set(item.year, [...(map.get(item.year) || []), item])
  return [...map.entries()]
})

function scrollToView() {
  for (const item of calendarMonthRef.value)
    item.scrollToViewIfThisMonth(new Date())
}

onMounted(scrollToView)
</script>

<template>
  <div v-for="[year, monthList] in yearList" :key="year" w-84>
    <div text-8 my-2>
      {{ year }}
    </div>
    <div grid grid-cols-3>
      <CalendarMonth
        v-for="{ month } in monthList"
        :ref="calendarMonthRef.set"
        :key="`${year}-${month}`" v-model:selected="dateVModel"
        :year="year" :month="month" :weekdays="weekdays" :active-status-map="activeStatusMap"
        small
      />
    </div>
  </div>
</template>
