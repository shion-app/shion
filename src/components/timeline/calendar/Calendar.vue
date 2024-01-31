<script setup lang="ts">
import { startOfMonth } from 'date-fns'
import colors from 'vuetify/util/colors'

import type { ActiveStatusMap, CalendarMonthType } from './types'
import type { SelectActivity, SelectNote } from '@/modules/database'
import { db } from '@/modules/database'

const props = defineProps<{
  date: Date
  category: 'plan' | 'label' | 'monitor' | string & {} | undefined
  id: number | undefined
}>()

const { date: dateVModel } = useVModels(props)

const { format } = useDateFns()

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
  const map: ActiveStatusMap = new Map()
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
    return colors.green.lighten2
  if (hour < 2)
    return colors.green.lighten1
  if (hour < 3)
    return colors.green.darken1
  if (hour < 5)
    return colors.green.darken2
  if (hour < 7)
    return colors.green.darken3
  return colors.green.darken4
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
      <month-grid v-model:date="dateVModel" v-model:current-year="currentYear" :active-status-map="activeStatusMap" :list="list" />
    </template>
    <template v-else>
      <year-grid v-model:date="dateVModel" :active-status-map="activeStatusMap" :list="list" />
    </template>
  </div>
  <status-bar-teleport :xs="false">
    <tooltip-button
      :tooltip="isMonthMode ? $t('statusBar.calendar.switch.year') : $t('statusBar.calendar.switch.month')"
      location="top"
      :text="isMonthMode ? $t('statusBar.calendar.month') : $t('statusBar.calendar.year')"
      variant="text"
      @click="() => toggleMode()"
    />
  </status-bar-teleport>
</template>
