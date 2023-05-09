<script setup lang="ts">
import type { Label } from '@interfaces/index'
import { message } from 'ant-design-vue'

const props = defineProps<{
  type: 'create' | 'update'
  visible: boolean
  model: Label
}>()

const emit = defineEmits(['refresh', 'update:visible'])

const { visible: visibleVModel, model: vModel } = useVModels(props)
const { t } = useI18n()
const { close } = useFormDialog(visibleVModel, vModel)

const title = computed(() => props.type == 'create' ? t('label.create') : t('label.update'))
const request = computed(() => props.type == 'create' ? create : update)

function create() {
  const { name } = vModel.value
  return createLabel({
    name,
  })
}

function update() {
  const { name, id } = vModel.value
  return updateLabel(id, {
    name,
  })
}

async function finish() {
  try {
    await request.value()
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
  <a-modal v-model:visible="visibleVModel" :title="title" :footer="null">
    <modal-form v-model:model="vModel" @finish="finish" @cancel="close">
      <a-form-item name="name" :label="$t('label.name')" :rules="[{ required: true }]">
        <a-input v-model:value="vModel.name" />
      </a-form-item>
    </modal-form>
  </a-modal>
</template>
