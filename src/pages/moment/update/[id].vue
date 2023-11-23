<script setup lang="ts">
import { db } from '@/modules/database'
import type { SelectMoment } from '@/modules/database'

const props = defineProps<{
  id: string
}>()

const initial = {
  title: '',
  content: '',
} as SelectMoment

const moment = ref({
  title: '',
  content: '',
} as SelectMoment)

const title = computed({
  get: () => moment.value.title,
  set: v => (moment.value.title = v),
})
const content = computed({
  get: () => moment.value.content,
  set: v => (moment.value.content = v),
})

const hasChanged = computed(() => initial.title != title.value || initial.content != content.value)

const { onEditGuard, submit } = useMoment()

onEditGuard(hasChanged)

async function init() {
  const [value] = await db.moment.select({
    id: Number(props.id),
  })
  moment.value = value
  Object.assign(initial, value)
}

async function handleSubmit() {
  submit(title, () => db.moment.update(Number(props.id), {
    title: title.value,
    content: content.value,
  }))
}

init()
</script>

<template>
  <moment-edit v-model:title="title" v-model:content="content" @submit="handleSubmit" />
</template>
