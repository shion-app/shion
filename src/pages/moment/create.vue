<script setup lang="ts">
import { db } from '@/modules/database'

const title = ref('')
const content = ref('')

const router = useRouter()
const { t } = useI18n()
const { success, error } = useNotify()
const { parseError } = useDatabase()

async function handleSubmit() {
  if (!title.value) {
    return error({
      text: t('moment.tip.emptyTitle'),
    })
  }
  try {
    await db.moment.insert({
      time: Date.now(),
      title: title.value,
      content: content.value,
    })
  }
  catch (e) {
    // return error({
    //   text: parseError(e),
    // })
  }

  success({})
  router.push('/moment')
}
</script>

<template>
  <moment-edit v-model:title="title" v-model:content="content" @submit="handleSubmit" />
</template>
