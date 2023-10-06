<script setup lang="ts">
import { message } from 'ant-design-vue'
import { RangePicker } from 'ant-design-vue/es/date-picker/date-fns'

import { type SelectNote, db } from '@modules/database'

const props = defineProps<{
  visible: boolean
  model: SelectNote
}>()

const emit = defineEmits(['refresh', 'update:visible'])

const { visible: visibleVModel, model: vModel } = useVModels(props)
const { t } = useI18n()
const { close } = useFormDialog(visibleVModel, vModel)

const range = computed<[Date, Date]>({
  get() {
    return [new Date(vModel.value.start), new Date(vModel.value.end)]
  },
  set([a, b]) {
    vModel.value.start = a.getTime()
    vModel.value.end = b.getTime()
  },
})

async function finish() {
  const { start, end, id } = vModel.value
  try {
    await db.note.update(id, { start, end })
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
    </modal-form>
  </a-modal>
</template>
