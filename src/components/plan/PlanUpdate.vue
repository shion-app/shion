<script setup lang="ts">
import type { Plan } from '@interfaces/index'
import { message } from 'ant-design-vue'

const props = defineProps<{
  visible: boolean
  model: Plan
}>()

const emit = defineEmits(['refresh'])

const { visible: visibleVModel } = useVModels(props)
const { t } = useI18n()

async function finish(value) {
  try {
    await updatePlan(props.model.id, value)
  }
  catch (error) {
    message.error(t('error.unhandle', {
      error,
    }))
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
  <a-modal v-model:visible="visibleVModel" destroy-on-close :title="$t('plan.update')" :footer="null">
    <plan-form :default-value="model" @finish="finish" @cancel="cancel" />
  </a-modal>
</template>
