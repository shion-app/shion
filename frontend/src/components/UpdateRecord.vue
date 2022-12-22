<script lang="ts" setup>
import type { RawRecord } from '../interfaces'

const { id, data } = defineProps<{
  id: number
  data: RawRecord
}>()

const emit = defineEmits<{
  (event: 'refresh'): void
}>()

const { message } = useDialog()

let isShow = $ref(false)

function close() {
  isShow = false
}

async function submit(data: RawRecord) {
  const process = UpdateRecord(id, data)
  await message.loading({
    process,
  })
  emit('refresh')
}
</script>

<template>
  <v-dialog v-model="isShow" width="500">
    <template #activator="{ props: dialog }">
      <v-tooltip location="bottom">
        <template #activator="{ props: tooltip }">
          <div
            i-mdi:file-edit text-6 cursor-pointer v-bind="{
              ...dialog,
              ...tooltip,
            }" @click.stop=""
          />
        </template>
        <span>{{ $t("input.edit") }}</span>
      </v-tooltip>
    </template>
    <record-form :title="$t('input.edit')" :data="data" @close="close" @submit="submit" />
  </v-dialog>
</template>
