<script setup lang="ts">
import type { CreateLabel } from '@interfaces/index'

const props = withDefaults(defineProps<{
  defaultValue?: CreateLabel
}>(), {
  defaultValue: () => ({
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
    <a-form-item name="name" :label="$t('label.name')" :rules="[{ required: true }]">
      <a-input v-model:value="model.name" />
    </a-form-item>
  </modal-form>
</template>
