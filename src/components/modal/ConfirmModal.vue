<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'

defineProps<{
  title: string
  content?: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
}>()
</script>

<template>
  <VueFinalModal
    content-transition="dialog-transition"
    flex justify-center items-center
  >
    <v-card :title="title" class="w-[90vw] sm:w-[400px] sm:max-w-[500px]">
      <v-card-text>
        {{ content }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          :text="$t('modal.submit')"
          @click="emit('confirm')"
        />
      </v-card-actions>
    </v-card>
  </VueFinalModal>
</template>
