<script setup lang="ts">
import { endOfDay, startOfDay } from 'date-fns'

import type { SelectActivity, SelectNote } from '@/modules/database'
import { db } from '@/modules/database'

const date = ref(new Date())
const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const MIN_RECORD_TIME = 1000 * 60 * 2

const list = computed(() => [
  ...noteList.value.map(i => ({
    start: i.start,
    end: i.end,
    name: i.plan.name,
  })),
  ...activityList.value.map(i => ({
    start: i.start,
    end: i.end,
    name: i.program.name,
  })),
].filter(i => i.end - i.start > MIN_RECORD_TIME).sort((a, b) => a.start - b.start))

async function refresh() {
  const start = startOfDay(date.value).getTime()
  const end = endOfDay(date.value).getTime()
  ;[noteList.value, activityList.value] = await Promise.all([
    db.note.select({
      start,
      end,
    }), db.activity.select({
      start,
      end,
    })])
}

watch(date, refresh, {
  immediate: true,
})
</script>

<template>
  <div h-full flex>
    <timeline-graph flex-1 :list="list" />
    <calendar v-model:date="date" />
  </div>
</template>
