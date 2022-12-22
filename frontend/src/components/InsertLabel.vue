<script  lang="ts" setup>
import type { RawLabel } from '../interfaces'

const { message } = useDialog()


let isShow = $ref(false)

function close() {
  isShow = false
}

async function submit(data: RawLabel) {
  const { recordId, name } = data
  const process = InsertLabel(recordId, name)
  await message.loading({
    process,
  })
}
</script>

<template>
  <v-dialog v-model="isShow" width="500" activator="parent">
    <label-form @close="close" @submit="submit" />
  </v-dialog>
</template>
