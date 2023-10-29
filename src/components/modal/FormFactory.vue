<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import type { Form } from './types'

const props = defineProps<{
  form: Form
}>()

const { handleSubmit, handleReset } = useForm({
  validationSchema: props.form.reduce((prev, cur) => {
    if (cur.validationSchema)
      prev[cur.key] = cur.validationSchema

    return prev
  }, {}),
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
          <template #append-inner="{ isFocused }">
            <!-- <v-btn icon="mdi-palette" /> -->
            <VColorPicker
              v-if="isFocused.value"
              v-model="field.value.value"
              hide-inputs
              mode="hex"
              canvas-height="100"
              position="absolute"
              left-0
              z-1000
            />
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
