<script lang="ts" setup>
import { format, isSameDay } from 'date-fns'

import type { main } from '../../../wailsjs/go/models'

import svg from '../../assets/time.svg'

const { id } = defineProps<{ id: string }>()

const { t, locale } = $(useI18n())
let timeList = $ref<main.Time[]>([])
let labelList = $ref<main.Label[]>([])

const date = $ref(new Date())

async function getTimeList() {
  timeList = await QueryTime(Number(id))
}

async function getLabelList() {
  labelList = await QueryLabel(Number(id))
}

getTimeList()
getLabelList()

const activeList = $computed(() => timeList.filter(item => isSameDay(item.start, date)))

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

function formatLabel(recordID: number) {
  const list = labelList.filter(item => item.recordID === recordID)
  if (list.length)
    return list.map(label => `${label.name} ${formatHourMinute(label.totalTime)}`).join(' | ')

  return ''
}
</script>

<template>
  <div flex flex-col h-full>
    <calendar-graph v-model:date="date" :list="timeList" />
    <div overflow-y-auto flex-grow>
      <empty v-if="!activeList.length">
        <img :src="svg" alt="time">
      </empty>
      <v-timeline v-else line-inset="6">
        <v-timeline-item
          v-for="{ id, start, end, recordID }, index in activeList" :key="id" :dot-color="getColor(index)"
          size="small"
        >
          <div>{{ formatTime(start) }} - {{ formatTime(end) }}</div>
          <div>{{ formatHourMinute(end - start) }}</div>
          <div v-if="recordID" flex items-center>
            <div i-mdi:label text-4 />
            <div>{{ formatLabel(recordID) }}</div>
          </div>
        </v-timeline-item>
      </v-timeline>
    </div>
  </div>
</template>
