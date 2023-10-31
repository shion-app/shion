<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import type { BuildSchemaObject, Form } from '@interfaces/index'

const props = defineProps<{
  form: Form
  schema: BuildSchemaObject
  formId: string
}>()

const emit = defineEmits<{
  (e: 'confirm', values, setErrors: (fields) => void): void
}>()

const { handleSubmit, setErrors } = useForm({
  validationSchema: toTypedSchema(props.schema(z)),
})

const fields = props.form.map(({ key, value }) => {
  const field = useField(key)
  field.resetField({
    value,
  })
  return {
    key,
    field,
  }
})

const transformForm = computed(() =>
  props.form.map((i) => {
    const { field } = fields.find(f => f.key == i.key)!
    return {
      ...i,
      field,
    }
  }))

const submit = handleSubmit((values) => {
  emit('confirm', values, setErrors)
})
</script>

<template>
  <form :id="formId" @submit.prevent="submit">
    <template v-for="{ type, key, field, label, props: itemProps } in transformForm" :key="key">
      <VTextField
        v-if="type == 'textField'"
        v-model="field.value.value"
        :label="label"
        :error-messages="field.errorMessage.value"
        v-bind="itemProps"
      />
      <template v-if="type == 'colorPicker'">
        <VTextField
          :model-value="field.value.value"
          readonly
          :label="label"
          :error-messages="field.errorMessage.value"
          v-bind="itemProps"
        >
          <template #append>
            <!-- @vue-ignore -->
            <color-picker-button v-model="field.value.value" />
          </template>
        </VTextField>
      </template>
    </template>
  </form>
</template>
