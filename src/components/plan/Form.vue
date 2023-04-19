<script setup lang="ts">
import type { Plan } from '@interfaces/database'

const props = withDefaults(defineProps<{
  defaultValue?: Pick<Plan, 'id' | 'name'>
}>(), {
  defaultValue: () => ({
    id: 0,
    name: '',
  }),
})

const emit = defineEmits(['finish', 'cancel'])

const model = ref(props.defaultValue)

function finish() {
  emit('finish', {
    name: model.value.name,
  })
}
</script>

<template>
  <modal-form :model="model" @finish="finish" @cancel="() => $emit('cancel')">
    <a-form-item name="name" :label="$t('plan.name')" :rules="[{ required: true }]">
      <a-input v-model:value="model.name" />
    </a-form-item>
  </modal-form>
</template>
