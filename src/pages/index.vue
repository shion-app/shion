<script setup lang="ts">
import type { RecentNote } from '@interfaces/database'

const list = ref<Array<RecentNote>>([])

async function init() {
  list.value = await selectRecentNote()
}

init()
</script>

<template>
  <div v-if="list.length" class="w-[500px]" p-6 space-y-4>
    <div
      v-for="{ planId, planName, labelId, labelName, date, totalTime } in list" :key="`${planId}-${labelId}`"
      rounded-2
      p-4
      bg-white
      shadow-lg
      hover:shadow-xl
      transition-shadow
    >
      <div text-6 font-bold>
        {{ date }}
      </div>
      <div>{{ planName }}</div>
      <div>{{ labelName }}</div>
      <div>{{ formatHHmm(totalTime) }}</div>
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
</template>
