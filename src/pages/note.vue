<script setup lang="ts">
import { Modal, message } from 'ant-design-vue'
import { getDate, getMonth, getYear, isSameDay } from 'date-fns'

import { type SelectNote, db } from '@modules/database'

const { query } = useRoute()
const { t } = useI18n()

const { planId, labelId } = query

const noteRange = {
  start: 0,
  end: 0,
}

const noteList = ref<Array<SelectNote>>([])
const noteUpdateVisible = ref(false)
const noteModel = ref({} as SelectNote)

const calendarData = computed(() => {
  const map = new Map<string, {
    total: number
    colors: string[]
  }>()
  noteList.value.forEach(({ start, end, label }) => {
    const year = getYear(start)
    const month = getMonth(start)
    const date = getDate(start)
    const time = `${year}-${month}-${date}`
    if (map.has(time)) {
      const { total, colors } = map.get(time)!
      map.set(time, {
        total: total + end - start,
        colors: [...new Set([...colors, label.color])],
      })
    }
    else {
      map.set(time, {
        total: end - start,
        colors: [label.color],
      })
    }
  })
  return map
})
const noteGroupList = computed(() => {
  const list: Array<Array<SelectNote>> = []
  let group: Array<SelectNote> = []
  for (const note of noteList.value) {
    if (group.length) {
      const last = group.at(-1)!
      if (format(last.start, 'yyyy-MM-dd') == format(note.start, 'yyyy-MM-dd')) {
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
  if (planId !== undefined) {
    noteList.value = await db.note.select({
      start,
      end,
      planId: Number(planId),
    })
  }
  if (labelId !== undefined) {
    noteList.value = await db.note.select({
      start,
      end,
      labelId: Number(labelId),
    })
  }
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
    return isSameDay(time, new Date(Number(year), Number(month), Number(date)))
  })
  if (!node)
    node = noteRef.value.at(-1)

  if (node) {
    node.scrollIntoView({
      block: 'center',
    })
  }
}

function getNote(list: Array<SelectNote>) {
  return list[0]
}

function handleRemove(note: SelectNote) {
  Modal.confirm({
    title: t('modal.confirmDelete'),
    async onOk() {
      await db.note.remove(note.id)
      message.success(t('message.success'))
      refresh(noteRange.start, noteRange.end)
    },
  })
}

function handleUpdate(note: SelectNote) {
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
          :data-year="getYear(getNote(group).start)"
          :data-month="getMonth(getNote(group).start)"
          :data-date="getDate(getNote(group).start)"
          p-4 bg-white rounded-4 space-y-2
        >
          <div flex items-center>
            <div i-mdi:calendar-text text-6 mr-2 />
            <div text-5>
              {{ format(getNote(group).start, 'yyyy-MM-dd') }}
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
              <div>{{ format(note.start, 'HH : mm') }} - {{ format(note.end, 'HH : mm') }}</div>
              <div>{{ spendTime(note.start, note.end) }}</div>
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
