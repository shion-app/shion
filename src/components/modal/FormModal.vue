<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
import type { BuildSchemaObject, Form } from './types'

defineProps<{
  title: string
  form: Form
  schema: BuildSchemaObject
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
}>()
</script>

<template>
  <VueFinalModal
    flex justify-center items-center
  >
    <v-card :title="title" min-width="400" max-width="600">
      <v-card-text>
        <form-factory :form="form" :schema="schema" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text="Close Dialog"
          @click="emit('confirm')"
        />
      </v-card-actions>
    </v-card>
  </VueFinalModal>
</template>
