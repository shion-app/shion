<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
  label: string
  errorMessages?: string
}>()

defineEmits(['update:modelValue'])

defineOptions({
  inheritAttrs: false,
})

const { modelValue } = useVModels(props)

// [@vue/compiler-sfc] Unresolvable type: TSConditionalType
// attrs: FormItemProps['colorPicker']
</script>

<template>
  <v-text-field
    :model-value="modelValue"
    readonly
    :label="props.label"
    :error-messages="props.errorMessages"
  >
    <template #append>
      <color-picker-button v-model="modelValue" v-bind="$attrs" />
    </template>
  </v-text-field>
</template>
