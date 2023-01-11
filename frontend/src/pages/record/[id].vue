<script lang="ts" setup>
import { addDays, format, getDay, getTime, isSameDay, subDays } from 'date-fns'

import type { main } from '../../../wailsjs/go/models'

import svg from '../../assets/time.svg'

const { id } = defineProps<{ id: string }>()

const { t, locale } = $(useI18n())
let timeList = $ref<main.Time[]>([])
let labelList = $ref<Array<{
  timeID: number
  labels: main.Label[]
}>>([])

const date = $ref(new Date())
const activeTimeList = $computed(() => timeList.filter(item => isSameDay(item.start, date)))

getTimeList()

async function getTimeList() {
  const now = Date.now()
  const day = getDay(now)
  const dayTotal = (Calendar.WEEK - 1) * Calendar.DAY + day
  const start = getTime(subDays(now, dayTotal - 1))
  const end = getTime(addDays(now, 1))
  timeList = await QueryAllTime(Number(id), start, end)
  await getLabelList()
}

watch($$(date), v => getLabelList(v))

async function getLabelList(date: Date = new Date()) {
  const idList = timeList.filter(time => isSameDay(date, time.start)).map(({ id }) => id)
  labelList = await QueryAllLabelByTimeIDList(idList)
}

function getColor(index: number) {
  return index % 2 === 0 ? '#ccc' : '#fff'
}

function formatTime(time: number) {
  return format(new Date(time), 'p', { locale: getDateLocale(locale) })
}

function formatHourMinute(time: number) {
  const { hour, minute, second } = extractTime(time)
  return minute > 0 ? `${hour}${t('hour')}${minute}${t('minute')}` : `${second}${t('second')}`
}

function formatLabel(timeID: number) {
  const time = labelList.find(i => i.timeID === timeID)
  if (time?.labels.length)
    return time.labels.map(label => `${label.name} ${formatHourMinute(label.totalTime)}`).join(' | ')
  return ''
}
</script>

<template>
  <div flex flex-col h-full>
    <calendar-graph v-model:date="date" :list="timeList" />
    <div overflow-y-auto flex-grow>
      <empty v-if="!activeTimeList.length">
        <img :src="svg" alt="time">
      </empty>
      <v-timeline v-else line-inset="6">
        <v-timeline-item
          v-for="{ id, start, end }, index in activeTimeList" :key="id" :dot-color="getColor(index)"
          size="small"
        >
          <div>{{ formatTime(start) }} - {{ formatTime(end) }}</div>
          <div>{{ formatHourMinute(end - start) }}</div>
          <div v-if="formatLabel(id)" flex items-center>
            <div i-mdi:label text-4 />
            <div>{{ formatLabel(id) }}</div>
          </div>
        </v-timeline-item>
      </v-timeline>
    </div>
  </div>
</template>
