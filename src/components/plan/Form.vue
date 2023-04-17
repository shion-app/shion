<script setup lang="ts">
import type { FormInstance } from 'ant-design-vue'

interface Plan {
  id: number
  name: string
}

const props = withDefaults(defineProps<{
  defaultValue?: Plan
}>(), {
  defaultValue: () => ({
    id: 0,
    name: '',
  }),
})

const model = ref<Plan>(props.defaultValue)
const formRef = ref<FormInstance>()

async function submit() {
  await formRef.value?.validate()
  return model.value
}

defineExpose({
  submit,
})
</script>

<template>
  <a-form ref="formRef" :model="model" autocomplete="off">
    <a-form-item name="name" :label="$t('plan.name')" :rules="[{ required: true }]">
      <a-input v-model:value="model.name" />
    </a-form-item>
  </a-form>
</template>
