<script setup lang="ts">
import { db } from '@/modules/database'

const title = ref('')
const content = ref('')

const router = useRouter()
const { t } = useI18n()
const { success, error } = useNotify()
const { getI18nMessage, isUniqueError } = useDatabase()

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
    if (isUniqueError(e)) {
      return error({
        text: t('moment.tip.duplicateTitle'),
      })
    }
    return error({
      text: getI18nMessage(e),
    })
  }

  success({})
  router.push('/moment')
}
</script>

<template>
  <moment-edit v-model:title="title" v-model:content="content" @submit="handleSubmit" />
</template>
