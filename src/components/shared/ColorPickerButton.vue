<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
}>()

defineEmits(['update:modelValue'])

defineOptions({
  inheritAttrs: false,
})

const { modelValue } = useVModels(props)
</script>

<template>
  <v-overlay location="bottom center" offset="10" location-strategy="connected">
    <template #activator="{ props: overlayProps }">
      <v-btn icon="mdi-palette" :color="modelValue" v-bind="overlayProps" />
    </template>
    <VColorPicker
      v-model="modelValue"
      hide-inputs
      mode="hex"
      v-bind="$attrs"
    />
  </v-overlay>
</template>
