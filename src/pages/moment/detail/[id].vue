<script setup lang="ts">
import { isThisYear } from 'date-fns'

import { type SelectMoment, db } from '@/modules/database'

const props = defineProps<{
  id: string
}>()

const detail = ref<SelectMoment>()
const content = computed(() => detail.value?.content || '')
const time = computed(() =>
  detail.value
    ? isThisYear(detail.value.time) ? format(detail.value.time, 'MM-dd HH:mm') : format(detail.value.time, 'yyyy-MM-dd HH:mm')
    : '')

async function init() {
  const [moment] = await db.moment.select({
    id: Number(props.id),
  })
  detail.value = moment
}

init()
</script>

<template>
  <div h-full flex flex-col>
    <div flex px-6 py-2 items-center>
      <div text-6>
        {{ detail?.title }}
      </div>
      <div flex-1 />
      <div>{{ time }}</div>
    </div>
  </div>
</template>
