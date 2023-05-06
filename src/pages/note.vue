<script setup lang="ts">
import type { Note } from '@interfaces/index'
import { getDate, getMonth, getYear, isSameDay } from 'date-fns'

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
const noteGroupList = computed(() => {
  const list: Array<Array<Note>> = []
  let group: Array<Note> = []
  for (const note of noteList.value) {
    if (group.length) {
      const last = group.at(-1)!
      if (format(last.startTime, 'yyyy-MM-dd') == format(note.startTime, 'yyyy-MM-dd')) {
        group.push(note)
      }
      else {
        list.push(group)
        group = [note]
      }
    }
    else {
      group.push(note)
    }
  }
  list.push(group)
  return list
})

const noteRef = useTemplateRefsList<HTMLElement>()

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
  const node = noteRef.value.find((i) => {
    const { year, month, date } = i.dataset
    return isSameDay(time, new Date(`${year}-${month}-${date}`))
  })
  if (node) {
    node.scrollIntoView({
      block: 'center',
    })
  }
}

function getNote(list: Array<Note>) {
  return list[0]
}
</script>

<template>
  <div flex h-full>
    <div flex-1 overflow-y-auto p-4>
      <div v-if="!noteList.length" h-full flex justify-center items-center>
        <a-empty />
      </div>
      <div v-else space-y-4>
        <div
          v-for="group in noteGroupList" :key="group.map(i => i.id).join('-')"
          :ref="noteRef.set"
          :data-year="getYear(getNote(group).startTime)"
          :data-month="getMonth(getNote(group).startTime)"
          :data-date="getDate(getNote(group).startTime)"
          p-4 bg-white rounded-4 space-y-2
        >
          <div flex items-center>
            <div i-mdi:calendar-text text-6 mr-2 />
            <div text-5>
              {{ format(getNote(group).startTime, 'yyyy-MM-dd') }}
            </div>
          </div>
          <div v-for="{ startTime, endTime, id, description } in group" :key="id" flex>
            <div i-mdi:notebook text-6 mr-2 />
            <div>
              <div>{{ format(startTime, 'HH : mm') }} - {{ format(endTime, 'HH : mm') }}</div>
              <div>{{ spendTime(startTime, endTime) }}</div>
              <div>{{ description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Calendar :data="calendarData" @refresh="handleRefresh" @click="slide" />
  </div>
</template>
