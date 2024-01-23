<script setup lang="ts">
import { startOfMonth } from 'date-fns'

import type { SelectActivity, SelectNote } from '@/modules/database'
import { db } from '@/modules/database'

const props = defineProps<{
  date: Date
  category: 'plan' | 'label' | 'monitor' | string & {} | undefined
  id: number | undefined
}>()

const { date: dateVModel } = useVModels(props)

const { locale } = useI18n()
const { format } = useDateFns()

interface CalendarMonthType {
  year: number
  month: number
}

let generatedYear = new Date().getFullYear()

const list = ref<Array<CalendarMonthType>>([])
const currentYear = ref(new Date().getFullYear())

const calendarMonthRef = useTemplateRefsList<{
  scrollToViewIfThisMonth(date: Date): void
}>()
const scrollContainer = templateRef<HTMLElement>('scrollContainer')

const weekdays = computed(() => locale.value == 'zh-CN' ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])
const weekdaysName = computed(() => weekdays.value.map(i => dayMap[locale.value][i]))
const activeStatusMap = computedAsync(async () => {
  if (typeof props.id != 'number')
    return new Map()

  const { year: startYear, month: startMonth } = list.value[0]
  const startDate = startOfMonth(new Date().setFullYear(startYear, startMonth - 1))
  const endDate = new Date()
  const start = startDate.getTime()
  const end = endDate.getTime()

  let noteSelect = {}
  let activitySelect = {}
  if (props.category == 'plan') {
    noteSelect = {
      start,
      end,
      planId: props.id,
    }
  }
  if (props.category == 'label') {
    noteSelect = {
      start,
      end,
      labelId: props.id,
    }
  }
  if (props.category == 'monitor') {
    activitySelect = {
      start,
      end,
      programId: props.id,
    }
  }

  let noteList: Array<SelectNote> = []
  let activityList: Array<SelectActivity> = []

  if (Object.keys(noteSelect).length > 0)
    noteList = await db.note.select(noteSelect)

  if (Object.keys(activitySelect).length > 0)
    activityList = await db.activity.select(activitySelect)

  const range = [startDate, endDate] as [Date, Date]
  const data = [
    ...splitByDay(noteList, range).map(i => ({
      start: i.start,
      end: i.end,
    })),
    ...splitByDay(activityList, range).map(i => ({
      start: i.start,
      end: i.end,
    })),
  ]
  const timeMap = new Map<string, number>()
  for (const { start, end } of data) {
    const date = format(start, 'yyyy-MM-dd')
    timeMap.set(date, (timeMap.get(date) || 0) + end - start)
  }
  const map = new Map<string, { color: string; time: number }>()
  for (const key of timeMap.keys()) {
    const value = timeMap.get(key)!
    map.set(key, {
      time: value,
      color: getColorByTime(value),
    })
  }
  return map
})

function getColorByTime(time: number) {
  const { hour } = extractTime(time).raw
  if (hour < 1)
    return '#9be9a8'
  if (hour < 2)
    return '#40c463'
  if (hour < 3)
    return '#30a14e'
  return '#216e39'
}

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

function scrollToView() {
  for (const item of calendarMonthRef.value)
    item.scrollToViewIfThisMonth(new Date())
}

function handleSelectDate(date: Date) {
  dateVModel.value = date
}

function onScroll() {
  const { top } = arrivedState
  if (top)
    list.value.unshift(...generate(--generatedYear))
}

init()

onMounted(scrollToView)
</script>

<template>
  <div ref="scrollContainer" h-full overflow-y-auto overflow-x-hidden relative ml-2>
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
      v-for="{ year, month } in list"
      :ref="calendarMonthRef.set"
      :key="`${year}-${month}`"
      v-model:selected="dateVModel" :year="year" :month="month" :weekdays="weekdays" :active-status-map="activeStatusMap"
      @select="handleSelectDate"
      @in-viewport="year => currentYear = year"
    />
  </div>
</template>
