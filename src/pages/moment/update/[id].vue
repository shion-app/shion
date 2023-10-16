<script setup lang="ts">
import { db } from '@modules/database'
import type { DatabaseError, SelectMoment } from '@modules/database'

import { message } from 'ant-design-vue'

const props = defineProps<{
  id: string
}>()

const moment = ref<SelectMoment>()

const title = computed({
  get: () => moment.value?.title || '',
  set: v => moment.value && (moment.value.title = v),
})
const content = computed({
  get: () => moment.value?.content || '',
  set: v => moment.value && (moment.value.content = v),
})

const router = useRouter()
const { t } = useI18n()

async function init() {
  const [value] = await db.moment.select({
    id: Number(props.id),
  })
  moment.value = value
}

async function handleSubmit() {
  if (!title.value)
    return message.error(t('moment.tip.emptyTitle'))
  try {
    await db.moment.update(Number(props.id), {
      title: title.value,
      content: content.value,
    })
  }
  catch (error) {
    message.error((error as DatabaseError).message)
  }

  message.success(t('message.success'))
  router.push('/moment')
}

init()
</script>

<template>
  <moment-edit v-model:title="title" v-model:content="content" @submit="handleSubmit" />
</template>
