<script lang="ts" setup>
import { mdiPlus } from '@mdi/js'
import type { RawRecord } from '../interfaces'

const emit = defineEmits<{
  (event: 'refresh'): void
}>()

let isShow = $ref(false)

function close() {
  isShow = false
}

async function confirm(data: RawRecord) {
  const { name, type, exe } = data
  await InsertRecord(name, type, exe)
  close()
  emit('refresh')
}
</script>

<template>
  <v-dialog v-model="isShow" width="500">
    <template #activator="{ props }">
      <v-btn color="green" :prepend-icon="mdiPlus" v-bind="props">
        {{ $t("input.add") }}
      </v-btn>
    </template>
    <record :title="$t('input.add')" @close="close" @confirm="confirm" />
  </v-dialog>
</template>
