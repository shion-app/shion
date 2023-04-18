<script setup lang="ts">
import { message } from 'ant-design-vue'

import type { CreatePlan } from '@interfaces/index'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['refresh'])

const { visible: visibleVModel } = useVModels(props)
const { t } = useI18n()

const form = ref<{
  submit: () => Promise<CreatePlan>
}>()

async function handleOk() {
  let data: CreatePlan
  try {
    data = await form.value!.submit()
  }
  catch {
    return
  }
  const { name } = data
  try {
    await createPlan({
      name,
    })
  }
  catch (error) {
    message.error((error as ErrorMessage).msg)
    return
  }
  visibleVModel.value = false
  emit('refresh')
  message.success(t('message.success'))
}
</script>

<template>
  <a-modal v-model:visible="visibleVModel" destroy-on-close :title="$t('plan.create')" @ok="handleOk">
    <plan-form ref="form" />
  </a-modal>
</template>
