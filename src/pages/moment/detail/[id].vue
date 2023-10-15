<script setup lang="ts">
import { MilkdownProvider } from '@milkdown/vue'

import { type SelectMoment, db } from '@modules/database'

const props = defineProps<{
  id: string
}>()

const detail = ref<SelectMoment>()
const content = computed(() => detail.value?.content || '')

async function init() {
  const [moment] = await db.moment.select({
    id: Number(props.id),
  })
  detail.value = moment
}

init()
</script>

<template>
  <MilkdownProvider>
    <MilkdownEditor :content="content" :editable="false" />
  </MilkdownProvider>
</template>
