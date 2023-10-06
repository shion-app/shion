<script setup lang="ts">
import { message } from 'ant-design-vue'

import type { SelectProgram } from '@modules/database'
import { db } from '@modules/database'

const props = defineProps<{
  visible: boolean
  model: SelectProgram
}>()

const emit = defineEmits(['refresh', 'update:visible'])

const { visible: visibleVModel, model: vModel } = useVModels(props)
const { t } = useI18n()
const { close } = useFormDialog(visibleVModel, vModel)

function update() {
  const { name, id, color } = vModel.value
  return db.program.update(id, {
    name,
    color,
  })
}

async function finish() {
  try {
    await update()
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
  <a-modal v-model:visible="visibleVModel" :title="$t('program.update')" :footer="null">
    <modal-form v-model:model="vModel" @finish="finish" @cancel="close">
      <a-form-item name="name" :label="$t('program.name')" :rules="[{ required: true }]">
        <a-input v-model:value="vModel.name" />
      </a-form-item>
      <a-form-item name="color" :label="$t('program.color')" :rules="[{ required: true }]">
        <input v-model="vModel.color" type="color">
      </a-form-item>
    </modal-form>
  </a-modal>
</template>
