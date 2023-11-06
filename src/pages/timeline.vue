<script setup lang="ts">
import { endOfDay, startOfDay } from 'date-fns'

import type { SelectActivity, SelectNote } from '@/modules/database'
import { db } from '@/modules/database'

const configStore = useConfigStore()

const { config } = storeToRefs(configStore)

const date = ref(new Date())
const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const list = computed(() => [
  ...noteList.value.map(i => ({
    start: i.start,
    end: i.end,
    name: i.plan.name,
    color: i.plan.color,
  })),
  ...activityList.value.map(i => ({
    start: i.start,
    end: i.end,
    name: i.program.name,
    color: i.program.color,
  })),
].filter(i => i.end - i.start > config.value.timelineMinMinute * 1000 * 60).sort((a, b) => a.start - b.start))

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
    <div flex-1>
      <timeline-graph v-if="list.length" :list="list" />
      <empty v-else />
    </div>
    <calendar v-model:date="date" />
  </div>
</template>
