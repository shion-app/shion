<script  lang="ts" setup>
import type { RawLabel } from '../interfaces'

const { message } = useDialog()

async function submit(data: RawLabel) {
  const { recordId, name } = data
  const process = InsertLabel(recordId, name)
  await message.loading({
    process,
  })
}
</script>

<template>
  <label-form @submit="submit" />
</template>
