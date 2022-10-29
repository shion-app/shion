<script lang="ts" setup>
import type { main } from '../../wailsjs/go/models'

const { list = [] } = defineProps<{
  list: main.Time[]
}>()

const { t } = useI18n()

function formatYYYYMMDD(date: number | Date) {
  return format(date, 'yyyy-MM-dd')
}

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

const now = Date.now()
const day = getDay(now)

const week = 53
const days = 7
const cellTotal = (week - 1) * 7 + day

const cellList: Array<{
  date: Date
  total: number
  x: number
  y: number
}> = []

const padding = 0
const offset = 3
const width = 14

const calendarWidth = padding * 2 + week * width + (week - 1) * offset
const calendarHeight = padding * 2 + days * width + (days - 1) * offset

for (let i = 0; i < cellTotal; i++) {
  const x = ~~(i / 7)
  const y = i % 7
  cellList.push({
    date: subDays(now, cellTotal - i - 1),
    total: 0,
    x: padding + x * (width + offset),
    y: padding + y * (width + offset),
  })
}
</script>

<template>
  <div
    relative
    :style="{
      width: `${calendarWidth}px`,
      height: `${calendarHeight}px`,
    }"
  >
    <v-tooltip v-for="{ x, y, date } in cellList" :key="date.getTime()" location="bottom">
      <template #activator="{ props }">
        <div
          :style="{
            transform: `translate(${x}px, ${y}px)`,
            width: `${width}px`,
            height: `${width}px`,
            backgroundColor: getColorByTime(calculate(getTotalByDate(date))),
          }"
          absolute
          rounded
          cursor-pointer
          v-bind="props"
        />
      </template>
      <div>{{ formatYYYYMMDD(date) }}</div>
      <div>
        {{ formatHourMinute(getTotalByDate(date)) }}
      </div>
    </v-tooltip>
  </div>
</template>

<style></style>
