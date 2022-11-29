<script lang="ts" setup>
import type { main } from '../../../wailsjs/go/models'

const { id } = defineProps<{ id: string }>()

let list = $ref<main.Time[]>([])

async function getList() {
  list = await QueryTime(Number(id))
}

getList()
</script>

<template>
  <calendar-graph :list="list" />
  <div v-for="{ id, start, end } in list" :key="id">
    {{ new Date(start) }} - {{ new Date(end) }}
  </div>
</template>
