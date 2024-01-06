<script setup lang="ts" generic="T">
import { VueFinalModal } from 'vue-final-modal'
import { nanoid } from 'nanoid'
import type { ComponentExposed } from 'vue-component-type-helpers'

import FormFactory from '../form/FormFactory.vue'
import type { BuildSchemaObject, Form } from './types'

defineProps<{
  title: string
  options?: {
    reset: boolean
  }
  form: Form<keyof T>
  schema: BuildSchemaObject
}>()

defineEmits<{
  (e: 'confirm', values: T, setErrors: (fields) => void): void
  (e: 'closed'): void
  (e: 'cancel'): void
  (e: 'formUpdate', v: Partial<T>): void
  (e: 'afterConfirm'): void
  (e: 'afterCancel'): void
}>()

const formId = `form-${nanoid()}`

const formFactory = ref<ComponentExposed<typeof FormFactory>>()
</script>

<template>
  <!-- fix: focus-trap 点击cascader list时无法选中 -->
  <VueFinalModal
    :focus-trap="false"
    content-transition="dialog-transition"
    flex justify-center items-center
    @closed="$emit('closed')"
    @click-outside="() => {
      $emit('cancel')
      $emit('afterCancel')
    }"
  >
    <v-card :title="title" max-height="360" max-width="600" class="w-[24rem]">
      <v-card-text class="overflow-auto!">
        <FormFactory
          ref="formFactory"
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
          v-if="$props.options?.reset"
          :text="$t('modal.reset')"
          @click="formFactory?.handleReset()"
        />
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
