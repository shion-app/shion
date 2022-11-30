<script lang="ts" setup>
import type { RawRecord } from '../interfaces'

const emit = defineEmits<{
  (event: 'refresh'): void
}>()

const { message } = useDialog()

let isShow = $ref(false)

function close() {
  isShow = false
}

async function submit(data: RawRecord) {
  const { name, type, exe } = data
  const process = InsertRecord(name, type, exe)
  close()
  await message.loading({
    process,
  })
  emit('refresh')
}
</script>

<template>
  <v-dialog v-model="isShow" width="500" activator="parent">
    <record-form :title="$t('input.add')" @close="close" @submit="submit" />
  </v-dialog>
</template>
