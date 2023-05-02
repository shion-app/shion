<script setup lang="ts">
import type { SelectProps } from 'ant-design-vue'

const emit = defineEmits(['finish', 'cancel'])

const model = ref<{
  planId?: number
  labelIdList?: Array<number>
}>({
  planId: undefined,
  labelIdList: [],
})

const planOptions = ref<SelectProps['options']>([])
const labelOptions = ref<SelectProps['options']>([])

async function init() {
  const [plan, label] = await Promise.all([selectPlan(), selectLabel()])
  planOptions.value = plan.map(({ id, name }) => ({
    label: name,
    value: id,
  }))
  labelOptions.value = label.map(({ id, name }) => ({
    label: name,
    value: id,
  }))
}

init()

function finish() {
  emit('finish', model.value)
}
</script>

<template>
  <modal-form :model="model" @finish="finish" @cancel="() => $emit('cancel')">
    <a-form-item name="planId" :label="$t('note.fill.plan')" :rules="[{ required: true }]">
      <a-select
        v-model:value="model.planId"
        :options="planOptions"
      />
    </a-form-item>
    <a-form-item name="labelIdList" :label="$t('note.fill.label')">
      <a-select
        v-model:value="model.labelIdList"
        mode="multiple"
        :options="labelOptions"
      />
    </a-form-item>
  </modal-form>
</template>
