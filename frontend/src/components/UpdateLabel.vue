<script  lang="ts" setup>
import type { RawLabel } from '../interfaces'

const { id, data } = defineProps<{
  id: number
  data: RawLabel
}>()

const { message } = useDialog()

let isShow = $ref(false)

function close() {
  isShow = false
}

async function submit(data: RawLabel) {
  const process = UpdateLabel(id, data)
  await message.loading({
    process,
  })
}
</script>

<template>
  <v-dialog v-model="isShow" width="500" activator="parent">
    <label-form :title="$t('input.edit')" :data="data" @close="close" @submit="submit" />
  </v-dialog>
</template>
