<script setup lang="ts">
import type { SelectProps } from 'ant-design-vue'

const emit = defineEmits(['finish', 'cancel'])

const model = ref<{
  planId?: number
}>({
  planId: undefined,
})

const planOptions = ref<SelectProps['options']>([])

async function init() {
  const data = await selectPlan()
  planOptions.value = data.map(({ id, name }) => ({
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
  </modal-form>
</template>
