<script setup lang="ts">
import { message } from 'ant-design-vue'
import { RangePicker } from 'ant-design-vue/es/date-picker/date-fns'

import type { Note } from '@interfaces/index'

const props = defineProps<{
  visible: boolean
  model: Note
}>()

const emit = defineEmits(['refresh', 'update:visible'])

const { visible: visibleVModel, model: vModel } = useVModels(props)
const { t } = useI18n()
const { close } = useFormDialog(visibleVModel, vModel)

const range = computed<[Date, Date]>({
  get() {
    return [new Date(vModel.value.startTime), new Date(vModel.value.endTime)]
  },
  set([a, b]) {
    vModel.value.startTime = a.getTime()
    vModel.value.endTime = b.getTime()
  },
})

async function finish() {
  const { startTime, endTime, description, id } = vModel.value
  try {
    await updateNote(id, { startTime, endTime, description })
  }
  catch (error) {
    message.error(error as string)
    return
  }
  close()
  emit('refresh')
  message.success(t('message.success'))
}
</script>

<template>
  <a-modal v-model:visible="visibleVModel" :title="$t('note.update.title')" :footer="null">
    <modal-form :model="vModel" @finish="finish" @cancel="close">
      <a-form-item :label="$t('note.update.timeRange')">
        <RangePicker
          v-model:value="range"
          :allow-clear="false"
          :show-time="{ format: 'HH:mm' }"
          format="YYYY-MM-DD HH:mm"
        />
      </a-form-item>
      <a-form-item :label="$t('note.update.description')">
        <a-input v-model:value="vModel.description" />
      </a-form-item>
    </modal-form>
  </a-modal>
</template>
