<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
  label: string
  errorMessages?: string
}>()

defineEmits(['update:modelValue'])

// [@vue/compiler-sfc] Unresolvable type: TSConditionalType
// attrs: FormItemProps['colorPicker']

const { modelValue } = useVModels(props)

const [focused, toggle] = useToggle(false)
</script>

<template>
  <v-text-field
    :model-value="modelValue"
    readonly
    :label="props.label"
    :error-messages="props.errorMessages"
  >
    <template #append>
      <v-btn icon="mdi-palette" :color="modelValue" @click="() => toggle()" />
      <v-tooltip v-model="focused" location="bottom" content-class="pointer-events-auto! bg-transparent">
        <template #activator="{ props: tooltipProps }">
          <div h-full v-bind="tooltipProps" />
        </template>
        <VColorPicker
          v-model="modelValue"
          hide-inputs
          mode="hex"
          v-bind="$attrs"
        />
      </v-tooltip>
    </template>
  </v-text-field>
</template>
