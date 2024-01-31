<script setup lang="ts">
import type { ComponentExposed } from 'vue-component-type-helpers'
import type { ActiveStatusMap, CalendarMonthType } from './types'

import CalendarMonth from './CalendarMonth.vue'

const props = withDefaults(defineProps<{
  date: Date
  currentYear: number
  list: CalendarMonthType[]
  activeStatusMap?: ActiveStatusMap
}>(), {
  activeStatusMap: () => new Map(),
})

const { date: dateVModel, currentYear: currentYearVModel } = useVModels(props)

type CalendarMonthExposed = ComponentExposed<typeof CalendarMonth>

const { locale } = useI18n()
const weekdays = computed(() => locale.value == 'zh-CN' ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])
const weekdaysName = computed(() => weekdays.value.map(i => dayMap[locale.value][i]))

const calendarMonthRef = useTemplateRefsList<CalendarMonthExposed>()

function scrollToView() {
  for (const item of calendarMonthRef.value)
    item.scrollToViewIfThisMonth(new Date())
}

onMounted(scrollToView)
</script>

<template>
  <div sticky top-0 left-0 right-0 bg-white z-1 shadow>
    <div text-5>
      {{ currentYear }}
    </div>
    <div flex>
      <div v-for="name in weekdaysName" :key="name" w-12 h-12 flex justify-center items-center>
        {{ name }}
      </div>
    </div>
  </div>
  <CalendarMonth
    v-for="{ year, month } in list" :ref="calendarMonthRef.set" :key="`${year}-${month}`"
    v-model:selected="dateVModel" :year="year" :month="month" :weekdays="weekdays" :active-status-map="activeStatusMap"
    @in-viewport="year => currentYearVModel = year"
  />
</template>
