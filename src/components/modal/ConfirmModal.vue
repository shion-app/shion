<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'

defineProps<{
  title: string
  content?: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'closed'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <VueFinalModal
    content-transition="dialog-transition"
    flex justify-center items-center
    @closed="$emit('closed')"
    @click-outside="$emit('cancel')"
  >
    <v-card :title="title" class="w-[90vw] sm:w-[400px]">
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
