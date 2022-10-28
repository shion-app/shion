<script lang="ts" setup>
import type { RawRecord } from '../interfaces';

const { id, data } = defineProps<{
    id: number
    data: RawRecord
}>()

const emit = defineEmits<{
  (event: "refresh"): void;
}>()

let isShow = $ref(false)

function close() {
  isShow = false
}

async function confirm(data: RawRecord) {
  await UpdateRecord(id, data)
  close()
  emit('refresh')
}
</script>

<template>
  <v-dialog v-model="isShow" width="500">
    <template v-slot:activator="{ props: dialog  }">
        <v-tooltip location="bottom">
              <template v-slot:activator="{ props:  tooltip }">
                <div i-mdi:file-edit text-6 cursor-pointer v-bind="{
                    ...dialog,
                    ...tooltip
                }" @click.stop=""></div>
              </template>
              <span>{{ $t("input.edit") }}</span>
            </v-tooltip>
    </template>
    <record :title="$t('input.edit')" :data="data"  @close="close" @confirm="confirm" />
  </v-dialog>
</template>
