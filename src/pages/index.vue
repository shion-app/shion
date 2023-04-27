<script setup lang="ts">
import type { Plan } from '@interfaces/index'

const { setMenu } = useMore()
const { t } = useI18n()
useConfig()

const planCreateVisible = ref(false)
const list = ref<Array<Plan>>([])

async function refresh() {
  const data = await selectPlan()
  list.value = data
}

setMenu(() => [
  {
    key: 'createPlan',
    title: t('plan.create'),
    click() {
      planCreateVisible.value = true
    },
  },
])

refresh()
</script>

<template>
  <div
    v-if="list.length"
    grid grid-cols-3
  >
    <div
      v-for="{ id, name, totalTime } in list"
      :key="id"
      rounded-2
      m-4
      p-4
      bg-white
      shadow-lg
    >
      <div>{{ name }}</div>
      <div>{{ totalTime }}</div>
    </div>
  </div>
  <a-empty v-else h-full flex flex-col justify-center />
  <plan-create v-model:visible="planCreateVisible" @refresh="refresh" />
</template>
