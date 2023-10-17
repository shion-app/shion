<script setup lang="ts">
import { type DatabaseError, db } from '@modules/database'
import { message } from 'ant-design-vue'

const title = ref('')
const content = ref('')

const router = useRouter()
const { t } = useI18n()

async function handleSubmit() {
  if (!title.value)
    return message.error(t('moment.tip.emptyTitle'))
  try {
    await db.moment.insert({
      time: Date.now(),
      title: title.value,
      content: content.value,
    })
  }
  catch (error) {
    return message.error((error as DatabaseError).message)
  }

  message.success(t('message.success'))
  router.push('/moment')
}
</script>

<template>
  <moment-edit v-model:title="title" v-model:content="content" @submit="handleSubmit" />
</template>
