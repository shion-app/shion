<script setup lang="ts">
import { message } from 'ant-design-vue'

import type { Plan } from '@interfaces/index'

const props = defineProps<{
  type: 'create' | 'update'
  visible: boolean
  model: Plan
}>()

const emit = defineEmits(['refresh', 'update:visible'])

const { visible: visibleVModel, model: vModel } = useVModels(props)
const { t } = useI18n()
const { close } = useFormDialog(visibleVModel, vModel)

const title = computed(() => props.type == 'create' ? t('plan.create') : t('plan.update'))
const request = computed(() => props.type == 'create' ? create : update)

function create() {
  const { name, color } = vModel.value
  return createPlan({
    name,
    color,
  })
}

function update() {
  const { name, id, color } = vModel.value
  return updatePlan(id, {
    name,
    color,
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
      <a-form-item name="name" :label="$t('plan.name')" :rules="[{ required: true }]">
        <a-input v-model:value="vModel.name" />
      </a-form-item>
      <a-form-item name="color" :label="$t('plan.color')" :rules="[{ required: true }]">
        <input v-model="vModel.color" type="color">
      </a-form-item>
    </modal-form>
  </a-modal>
</template>
