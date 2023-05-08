<script setup lang="ts">
import type { Note } from '@interfaces/index'
import { message } from 'ant-design-vue'

const props = defineProps<{
  visible: boolean
  model: Note
}>()

const emit = defineEmits(['refresh'])

const { visible: visibleVModel } = useVModels(props)
const { t } = useI18n()

async function finish(value) {
  try {
    await updateNote(props.model.id, value)
  }
  catch (error) {
    message.error(error as string)
    return
  }
  visibleVModel.value = false
  emit('refresh')
  message.success(t('message.success'))
}

function cancel() {
  visibleVModel.value = false
}
</script>

<template>
  <a-modal v-model:visible="visibleVModel" destroy-on-close :title="$t('note.update.title')" :footer="null">
    <note-form :default-value="model" @finish="finish" @cancel="cancel" />
  </a-modal>
</template>
