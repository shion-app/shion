<script lang="ts" setup>
import { format, isSameDay } from 'date-fns'

import type { main } from '../../../wailsjs/go/models'

const { id } = defineProps<{ id: string }>()

const { t, locale } = $(useI18n())
let list = $ref<main.Time[]>([])

const date = $ref(new Date())

async function getList() {
  list = await QueryTime(Number(id))
}

const activeList = $computed(() => list.filter(item => isSameDay(item.start, date)))

getList()

function getColor(index: number) {
  return index % 2 === 0 ? '#ccc' : '#fff'
}

function formatTime(time: number) {
  return format(new Date(time), 'p', { locale: getDateLocale(locale) })
}

function formatHourMinute(time: number) {
  const { hour, minute, second } = extractTime(time)
  return minute > 1 ? `${hour}${t('hour')}${minute}${t('minute')}` : `${second}${t('second')}`
}
</script>

<template>
  <div flex flex-col h-full>
    <calendar-graph v-model:date="date" :list="list" />
    <div overflow-y-auto flex-grow>
      <v-timeline line-inset="6">
        <v-timeline-item
          v-for="{ id, start, end }, index in activeList" :key="id" :dot-color="getColor(index)"
          size="small"
        >
          <div>{{ formatTime(start) }} - {{ formatTime(end) }}</div>
          <div>{{ formatHourMinute(end - start) }}</div>
        </v-timeline-item>
      </v-timeline>
    </div>
  </div>
</template>
