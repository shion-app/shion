<script lang="ts" setup>
import { addDays, differenceInCalendarDays, format, getDate, getDay, getMonth, startOfDay, subDays } from 'date-fns'
import { vElementSize } from '@vueuse/components'
import { debounce } from 'lodash-es'

import type { main } from '../../wailsjs/go/models'

const { list = [] } = defineProps<{
  list: main.Time[]
}>()

const { t, locale } = useI18n()

interface Cell {
  date: Date
  total: number
  x: number
  y: number
}

const cellRef = $ref<HTMLElement>()
const currentDate = $ref<Date>(new Date())
let cellList = $ref<Array<Cell>>([])

let calendarWidth = $ref(0)
let calendarHeight = $ref(200)
let cellWidth = $ref(0)
let monthList = $ref<Array<{
  date: Date
  x: number
}>>([])

const dateToActivityMap = $computed(() => {
  const map = new Map<
    string,
    {
      collection: Array<number>
      total: number
    }
  >()
  for (const time of list) {
    let { start } = time
    const { end } = time
    let temp = 0
    const diff = differenceInCalendarDays(end, start)
    for (let i = 0; i <= diff; i++) {
      const time = formatYYYYMMDD(start)
      temp = i === diff ? end : startOfDay(addDays(start, 1)).getTime()
      const match = map.get(time) || {
        collection: [],
        total: 0,
      }
      match.collection = [...match.collection, start, temp]
      match.total += temp - start
      map.set(time, match)
      start = temp
    }
    if (temp === 0) {
      const time = formatYYYYMMDD(start)
      const match = map.get(time) || {
        collection: [],
        total: 0,
      }
      match.collection = [...match.collection, start, end]
      match.total += end - start
      map.set(time, match)
    }
  }
  return map
})

const debounceResize = debounce(onResize, 300)

function formatYYYYMMDD(date: number | Date) {
  return format(date, 'yyyy-MM-dd')
}

function getColorByTime(time: number) {
  if (time === 0)
    return '#ebedf0'
  else if (time < 1)
    return '#9be9a8'
  else if (time < 3)
    return '#40c463'
  else if (time < 6)
    return '#30a14e'
  return '#216e39'
}

function formatHourMinute(time: number) {
  let minute = ~~(time / (1000 * 60))
  const hour = ~~(minute / 60)
  minute %= 60
  return `${hour}${t('hour')}${minute}${t('minute')}`
}

function calculate(time: number) {
  return time / (1000 * 60 * 60)
}

function getTotalByDate(date: Date) {
  return dateToActivityMap.get(formatYYYYMMDD(date))?.total || 0
}

function calcCellList() {
  const now = Date.now()
  const day = getDay(now)

  const week = 53
  const days = 7
  const cellTotal = (week - 1) * 7 + day + 1

  const offsetToWidthRatio = 0.2

  const padding = 24
  const width = (((calendarWidth - 2 * padding) / week) / (1 + offsetToWidthRatio))
  cellWidth = width
  const offset = (offsetToWidthRatio * width)
  calendarHeight = padding * 2 + days * width + (days - 1) * offset

  let currentMonth = -1

  for (let i = 0; i < cellTotal; i++) {
    const x = ~~(i / 7)
    const y = i % 7
    const cell: Cell = {
      date: subDays(now, cellTotal - i - 1),
      total: 0,
      x: padding + x * (width + offset),
      y: padding + y * (width + offset),
    }
    cellList.push(cell)
    if (i === 0 && getDate(cell.date) !== 1)
      continue
    if (y === 0) {
      const month = getMonth(cell.date) + 1
      if (currentMonth !== month) {
        monthList.push({
          date: cell.date,
          x: cell.x,
        })
        currentMonth = month
      }
    }
  }
}

function onResize({ width }: { width: number }) {
  monthList = []
  cellList = []
  calendarWidth = width
  calcCellList()
}

onBeforeUnmount(debounceResize.cancel)
</script>

<template>
  <div v-element-size="debounceResize" />
  <div
    relative
    :style="{
      width: `${calendarWidth}px`,
      height: `${calendarHeight}px`,
    }"
  >
    <div
      v-for="{ date, x } in monthList"
      :key="x" absolute :style="{
        transform: `translate(${x}px, 0px)`,

      }"
    >
      {{ format(date, 'MMM', { locale: getDateLocale(locale) }) }}
    </div>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <div
          v-for="{ x, y, date } in cellList" :key="date.getTime()"
          v-bind="props"
          ref="cellRef"
          :style="{
            transform: `translate(${x}px, ${y}px)`,
            width: `${cellWidth}px`,
            height: `${cellWidth}px`,
            backgroundColor: getColorByTime(calculate(getTotalByDate(date))),
          }"
          absolute
          rounded
          cursor-pointer
          @mouseenter="currentDate = date"
        />
      </template>
      <div>{{ formatYYYYMMDD(currentDate) }}</div>
      <div>
        {{ formatHourMinute(getTotalByDate(currentDate)) }}
      </div>
    </v-tooltip>
  </div>
</template>

