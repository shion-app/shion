<script setup lang="ts">
import { message } from 'ant-design-vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['refresh'])

const { visible: visibleVModel } = useVModels(props)
const { t } = useI18n()

async function finish(value) {
  try {
    await createLabel(value)
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
  <a-modal v-model:visible="visibleVModel" destroy-on-close :title="$t('label.create')" :footer="null">
    <plan-form @finish="finish" @cancel="cancel" />
  </a-modal>
</template>
