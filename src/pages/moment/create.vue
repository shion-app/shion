<script setup lang="ts">
import { MilkdownProvider } from '@milkdown/vue'
import { message } from 'ant-design-vue'

import { type DatabaseError, db } from '@modules/database'

const { t } = useI18n()
const router = useRouter()

const title = ref('')
const content = ref('')

async function handleCreate() {
  if (!title.value)
    return message.error(t('moment.tip.emptyTitle'))
  try {
    await db.moment.insert({
      time: Date.now(),
      title: title.value,
      content: content.value,
    })
    router.push('/moment')
  }
  catch (error) {
    message.error((error as DatabaseError).message)
  }
}
</script>

<template>
  <div h-full>
    <div flex p-2>
      <a-input v-model:value="title" :placeholder="$t('moment.inputTitle')" class="w-[300px]!" />
      <div flex-1 />
      <a-button type="primary" @click="handleCreate">
        {{ $t('moment.submit') }}
      </a-button>
    </div>
    <MilkdownProvider>
      <MilkdownEditor v-model:content="content" />
    </MilkdownProvider>
  </div>
</template>
