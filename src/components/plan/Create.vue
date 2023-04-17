<script setup lang="ts">
import { message } from 'ant-design-vue'

import type { CreatePlan } from '@database/request'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)

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
  const result = await createPlan({
    name,
  })
  if (result)
    message.error(result.msg)
  else
    visibleVModel.value = false
}
</script>

<template>
  <a-modal v-model:visible="visibleVModel" destroy-on-close :title="$t('plan.create')" @ok="handleOk">
    <plan-form ref="form" />
  </a-modal>
</template>
