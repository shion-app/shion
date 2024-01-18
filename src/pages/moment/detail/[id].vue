<script setup lang="ts">
import { isThisYear } from 'date-fns'

import { type SelectMoment, db } from '@/modules/database'

const props = defineProps<{
  id: string
}>()

const { format } = useDateFns()

const detail = ref<SelectMoment>()
const content = computed(() => detail.value?.content || '')
const time = computed(() =>
  detail.value
    ? isThisYear(detail.value.createdAt) ? format(detail.value.createdAt, 'MM-dd HH:mm') : format(detail.value.createdAt, 'yyyy-MM-dd HH:mm')
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
    <div flex px-4 py-2 items-center>
      <div text-6>
        {{ detail?.title }}
      </div>
      <div flex-1 />
      <div>{{ time }}</div>
    </div>
    <tiptap v-model:content="content" :editable="false" />
  </div>
</template>
