<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
}>()

const { modelValue } = useVModels(props)

const [focused, toggle] = useToggle(false)
</script>

<template>
  <v-btn icon="mdi-palette" :color="modelValue" @click="() => toggle()" />
  <v-tooltip v-model="focused" location="bottom" content-class="pointer-events-auto! bg-transparent">
    <template #activator="{ props: tooltipProps }">
      <div h-full v-bind="tooltipProps" />
    </template>
    <VColorPicker
      v-model="modelValue"
      hide-inputs
      mode="hex"
    />
  </v-tooltip>
</template>
