<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
import { nanoid } from 'nanoid'

import type { BuildSchemaObject, Form } from './types'

defineProps<{
  title: string
  form: Form
  schema: BuildSchemaObject
}>()

defineEmits<{
  (e: 'confirm', values, setErrors: (fields) => void): void
  (e: 'closed'): void
  (e: 'cancel'): void
  (e: 'formUpdate', v): void
  (e: 'afterConfirm'): void
  (e: 'afterCancel'): void
}>()

const formId = `form-${nanoid()}`
</script>

<template>
  <VueFinalModal
    content-transition="dialog-transition"
    flex justify-center items-center
    @closed="$emit('closed')"
    @click-outside="() => {
      $emit('cancel')
      $emit('afterCancel')
    }"
  >
    <v-card :title="title" min-width="400" max-width="600">
      <v-card-text>
        <form-factory
          :form="form"
          :schema="schema"
          :form-id="formId"
          @confirm="(...args) => {
            $emit('confirm', ...args)
            $emit('afterConfirm')
          }"
          @form-update="(...args) => $emit('formUpdate', ...args)"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          type="submit"
          :form="formId"
          :text="$t('modal.submit')"
        />
      </v-card-actions>
    </v-card>
  </VueFinalModal>
</template>
