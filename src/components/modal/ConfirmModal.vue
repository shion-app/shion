<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'

const props = defineProps<{
  title: string
  content?: string
  options?: {
    loading: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'closed'): void
  (e: 'cancel'): void
}>()

const loading = ref(false)

function handleConfirm() {
  if (props.options?.loading)
    loading.value = true

  emit('confirm')
}
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
          :loading="loading"
          :text="$t('modal.submit')"
          @click="handleConfirm"
        />
      </v-card-actions>
    </v-card>
  </VueFinalModal>
</template>
