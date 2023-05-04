<script setup lang="ts">
import type { Note } from '@interfaces/index'
import { getDate, getMonth, getYear, isSameDay } from 'date-fns'
import type { ComponentPublicInstance } from 'vue'

const { query } = useRoute()
const { planId, labelId } = query

const noteList = ref<Array<Note>>([])
const calendarData = computed(() => {
  const map = new Map<string, number>()
  noteList.value.forEach(({ startTime, endTime }) => {
    const year = getYear(startTime)
    const month = getMonth(startTime)
    const date = getDate(startTime)
    const time = `${year}-${month}-${date}`
    if (map.has(time)) {
      const total = map.get(time)!
      map.set(time, total + endTime - startTime)
    }
    else {
      map.set(time, endTime - startTime)
    }
  })
  return map
})
const timelineList = useTemplateRefsList<ComponentPublicInstance>()

async function refresh(start: number, end: number) {
  if (planId !== undefined)
    noteList.value = await selectNoteByPlanId(Number(planId), start, end)
  if (labelId !== undefined)
    noteList.value = await selectNoteByLabelId(Number(labelId), start, end)
}

function handleRefresh(range: Array<number>) {
  range.sort((a, b) => a - b)
  let start = 0
  let end = 0
  if (range.length > 1) {
    start = new Date(`${range[0]}-1-1`).getTime()
    end = new Date(`${range.at(-1)! + 1}-1-1`).getTime()
  }
  else {
    start = new Date(`${range[0]}-1-1`).getTime()
    end = new Date(`${range[0] + 1}-1-1`).getTime()
  }
  refresh(start, end)
}

function spendTime(start: number, end: number) {
  if (end - start < 60 * 1000) {
    return formatDistanceStrict(start, end, {
      unit: 'second',
    })
  }
  return formatDistanceStrict(start, end)
}

function slide(time: Date) {
  const nodeList = timelineList.value.map(i => i.$el) as HTMLElement[]
  const node = nodeList.find((i) => {
    const { year, month, date } = i.dataset
    return isSameDay(time, new Date(`${year}-${month}-${date}`))
  })
  if (node)
    node.scrollIntoView()
}
</script>

<template>
  <div flex h-full>
    <div flex-1 overflow-y-auto p-4>
      <div v-if="!noteList.length" h-full flex justify-center items-center>
        <a-empty />
      </div>
      <a-timeline v-else>
        <a-timeline-item
          v-for="{ startTime, endTime, id, description } in noteList" :key="id"
          :ref="timelineList.set"
          :data-year="getYear(startTime)"
          :data-month="getMonth(startTime)"
          :data-date="getDate(startTime)"
        >
          <div>
            {{ format(startTime, 'MM-dd') }}
          </div>
          <div>{{ format(startTime, 'HH : mm') }} - {{ format(endTime, 'HH : mm') }}</div>
          <div>{{ spendTime(startTime, endTime) }}</div>
          <div>{{ description }}</div>
        </a-timeline-item>
      </a-timeline>
    </div>
    <Calendar :data="calendarData" @refresh="handleRefresh" @click="slide" />
  </div>
</template>
