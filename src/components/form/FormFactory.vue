<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import type { BuildSchemaObject, Form } from '@/interfaces'

const props = defineProps<{
  form: Form
  schema: BuildSchemaObject
  formId: string
}>()

const emit = defineEmits<{
  (e: 'confirm', values, setErrors: (fields) => void): void
  (e: 'formUpdate', v): void
}>()

const { handleSubmit, setErrors } = useForm({
  validationSchema: toTypedSchema(props.schema(z)),
})

const fields = props.form.fields.map(({ key }) => {
  const field = useField(key)
  const value = props.form.values?.[key]
  field.resetField({
    value,
  })
  return {
    key,
    field,
  }
})

const transformForm = computed(() =>
  props.form.fields.map((i) => {
    const { field } = fields.find(f => f.key == i.key)!
    return {
      ...i,
      field,
    }
  }))

const fieldsModel = computed(() => Object.fromEntries(fields.map(({ key, field }) => [key, field.value.value])))

watch(fieldsModel, (v) => {
  emit('formUpdate', v)
}, {
  deep: true,
  immediate: true,
})

watchDeep(() => props.form.values, (v) => {
  for (const key in v) {
    const field = fields.find(i => i.key == key)
    if (!field)
      continue

    if (field.field.value.value != v[key])
      field.field.setValue(v[key])
  }
})

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
      <VTextField
        v-if="type == 'colorPicker'"
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
      <v-select
        v-if="type == 'select'"
        v-model="field.value.value"
        :label="label"
        :error-messages="field.errorMessage.value"
        v-bind="itemProps"
      />
    </template>
  </form>
</template>
