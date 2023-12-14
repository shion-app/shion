<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { VSelect, VTextField } from 'vuetify/components'

import ColorPicker from './ColorPicker.vue'
import Cascader from './Cascader.vue'
import type { BuildSchemaObject, Form, FormItemProps } from '@/interfaces'

const props = defineProps<{
  form: Form<any>
  schema: BuildSchemaObject
  formId: string
}>()

const emit = defineEmits<{
  (e: 'confirm', values, setErrors: (fields) => void): void
  (e: 'formUpdate', v): void
}>()

const validationSchema = computed(() => toTypedSchema(props.schema(z)))

const { handleSubmit, setErrors, handleReset } = useForm({
  validationSchema,
})

defineExpose({
  handleReset,
})

const fields = props.form.fields.map(({ key }) => {
  const field = useField(key)
  const value = props.form.values?.[key]
  field.setValue(value, false)
  return {
    key,
    field,
  }
})

const transformForm = computed(() =>
  props.form.fields.filter(i => typeof i.visible == 'boolean' ? i.visible : true).map((i) => {
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
      field.field.setValue(v[key], false)
  }
})

const submit = handleSubmit((values) => {
  emit('confirm', values, setErrors)
})

function component(type: keyof FormItemProps) {
  switch (type) {
    case 'textField':
      return VTextField
    case 'colorPicker':
      return ColorPicker
    case 'select':
      return VSelect
    case 'cascader':
      return Cascader
  }
}
</script>

<template>
  <form :id="formId" @submit.prevent="submit">
    <component
      :is="component(type)"
      v-for="{ type, key, field, label, props: itemProps } in transformForm"
      :key="key"
      v-model="field.value.value"
      :label="label"
      :error-messages="field.errorMessage.value"
      v-bind="itemProps"
    />
  </form>
</template>
