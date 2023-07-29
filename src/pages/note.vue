<script setup lang="ts">
import type { Note } from '@interfaces/index'
import { Modal, message } from 'ant-design-vue'

import { getDate, getMonth, getYear, isSameDay } from 'date-fns'

const { query } = useRoute()
const { t } = useI18n()

const { planId, labelId } = query

const noteRange = {
  start: 0,
  end: 0,
}

const noteList = ref<Array<Note>>([])
const noteUpdateVisible = ref(false)
const noteModel = ref({} as Note)

const calendarData = computed(() => {
  const map = new Map<string, {
    total: number
    colors: string[]
  }>()
  noteList.value.forEach(({ startTime, endTime, label }) => {
    const year = getYear(startTime)
    const month = getMonth(startTime)
    const date = getDate(startTime)
    const time = `${year}-${month}-${date}`
    if (map.has(time)) {
      const { total, colors } = map.get(time)!
      map.set(time, {
        total: total + endTime - startTime,
        colors: [...new Set([...colors, label.color])],
      })
    }
    else {
      map.set(time, {
        total: endTime - startTime,
        colors: [label.color],
      })
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
  noteRange.start = start
  noteRange.end = end
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
  let node = noteRef.value.find((i) => {
    const { year, month, date } = i.dataset
    return isSameDay(time, new Date(year, month, date))
  })
  if (!node)
    node = noteRef.value.at(-1)

  if (node) {
    node.scrollIntoView({
      block: 'center',
    })
  }
}

function getNote(list: Array<Note>) {
  return list[0]
}

function handleRemove(note: Note) {
  Modal.confirm({
    title: t('modal.confirmDelete'),
    async onOk() {
      await removeNote(note.id)
      message.success(t('message.success'))
      refresh(noteRange.start, noteRange.end)
    },
  })
}

function handleUpdate(note: Note) {
  noteUpdateVisible.value = true
  Object.assign(noteModel.value, note)
}

watchOnce(noteList, () => {
  slide(new Date())
}, {
  flush: 'post',
})
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
          <div v-for="note in group" :key="note.id" flex class="group">
            <div
              i-mdi:label text-5 mr-2 :style="{
                color: note.label.color,
              }"
            />
            <div>
              <div>
                {{ note.label.name }}
              </div>
              <div>{{ format(note.startTime, 'HH : mm') }} - {{ format(note.endTime, 'HH : mm') }}</div>
              <div>{{ spendTime(note.startTime, note.endTime) }}</div>
              <div>{{ note.description }}</div>
            </div>
            <div flex-1 />
            <div flex op-0 group-hover-op-100 transition-opacity-400 space-x-2 items-end>
              <a-tooltip placement="bottom">
                <template #title>
                  <span>{{ $t('button.update') }}</span>
                </template>
                <div i-mdi:file-edit-outline text-5 cursor-pointer @click="handleUpdate(note)" />
              </a-tooltip>
              <a-tooltip placement="bottom">
                <template #title>
                  <span>{{ $t('button.remove') }}</span>
                </template>
                <div i-mdi:delete-outline text-5 cursor-pointer @click="handleRemove(note)" />
              </a-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Calendar :data="calendarData" @refresh="handleRefresh" @click="slide" />
    <note-update v-model:visible="noteUpdateVisible" :model="noteModel" @refresh="() => refresh(noteRange.start, noteRange.end)" />
  </div>
</template>
