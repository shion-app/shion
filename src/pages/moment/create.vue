<script setup lang="ts">
import { db } from '@/modules/database'

const title = ref('')
const content = ref('')

const { onEditGuard, submit } = useMoment()

const hasChanged = computed(() => !!(title.value || content.value))

onEditGuard(hasChanged)

function handleSubmit() {
  submit(title, () => db.moment.insert({
    title: title.value,
    content: content.value,
  }))
}
</script>

<template>
  <moment-edit v-model:title="title" v-model:content="content" @submit="handleSubmit" />
</template>
