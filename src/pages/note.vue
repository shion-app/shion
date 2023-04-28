<script setup lang="ts">
import type { Note } from '@interfaces/index'

const { query } = useRoute()
const { planId } = query

const list = ref<Array<Note>>([])

async function refresh(start: number, end: number) {
  if (planId !== undefined)
    list.value = await selectNoteByPlanId(Number(planId), start, end)
}

function init() {
  const { start, end } = getRangeOfMonth(new Date())
  refresh(start, end)
}

init()
</script>

<template>
  <div flex>
    <div flex-1 />
    <Calendar />
  </div>
</template>
