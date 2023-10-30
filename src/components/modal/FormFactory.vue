<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import type { BuildSchemaObject, Form } from './types'

const props = defineProps<{
  form: Form
  schema: BuildSchemaObject
}>()

const { handleSubmit, handleReset } = useForm({
  validationSchema: toTypedSchema(props.schema(z)),
})

const transformForm = props.form.map((i) => {
  const field = useField(i.key)
  field.resetField({
    value: i.value,
  })
  return {
    ...i,
    field,
  }
})

const submit = handleSubmit((values) => {
  alert(JSON.stringify(values, null, 2))
})
</script>

<template>
  <form @submit.prevent="submit">
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

    <v-btn class="me-4" type="submit">
      submit
    </v-btn>

    <v-btn @click="handleReset">
      clear
    </v-btn>
  </form>
</template>
