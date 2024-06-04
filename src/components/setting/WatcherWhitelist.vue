<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog'

const props = defineProps<{
  modelValue: string[]
}>()

const { modelValue } = useVModels(props)
const { t } = useI18n()
const { warning } = useNotify()

function removeRow(path: string) {
  const index = modelValue.value.indexOf(path)
  if (index != -1)
    modelValue.value.splice(index, 1)
}

async function openDirectoryDialog() {
  const selected = await open({
    directory: true,
  })
  if (selected) {
    const index = modelValue.value.indexOf(selected)
    if (index != -1) {
      return warning({
        text: t('watcherWhitelist.duplicate'),
      })
    }
    modelValue.value.push(selected)
  }
}
</script>

<template>
  <div my-2 space-y-2>
    <v-text-field
      v-for="text, index in modelValue" :key="text" v-model="modelValue[index]" hide-details readonly
      density="comfortable" variant="outlined"
    >
      <template #append>
        <tooltip-button
          location="bottom" :tooltip="$t('watcherWhitelist.remove')" icon="mdi-trash-can"
          @click="removeRow(text)"
        />
      </template>
      <v-tooltip :text="text" location="bottom" activator="parent" />
    </v-text-field>
    <v-btn mt-2 color="primary" @click="openDirectoryDialog">
      {{ $t('watcherWhitelist.add') }}
    </v-btn>
  </div>
</template>
