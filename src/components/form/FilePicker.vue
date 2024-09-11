<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog'

const props = defineProps<{
  modelValue: string
  label: string
  errorMessages?: string
}>()

defineEmits(['update:modelValue'])

defineOptions({
  inheritAttrs: false,
})

const { modelValue } = useVModels(props)
const { t } = useI18n()

async function openFileDialog() {
  const selected = await open({
    filters: [
      {
        name: t('filePicker.name'),
        extensions: ['exe'],
      },
    ],
  })
  if (selected)
    modelValue.value = selected
}
</script>

<template>
  <v-tooltip :text="modelValue" location="bottom">
    <template #activator="{ props: tooltipProps }">
      <v-text-field
        :model-value="modelValue" readonly :label="props.label" :error-messages="props.errorMessages"
        v-bind="tooltipProps"
      >
        <template #append>
          <v-btn icon="mdi-file-search" @click="openFileDialog" />
        </template>
      </v-text-field>
    </template>
  </v-tooltip>
</template>
