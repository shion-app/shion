<script setup lang="ts">
import type { NestedMenuItemValue } from '@/interfaces'

const props = withDefaults(defineProps<{
  modelValue?: Array<NestedMenuItemValue>
  label: string
  errorMessages?: string
}>(), {
  modelValue: () => [],
})

defineEmits(['update:modelValue'])

const { modelValue } = useVModels(props)

const text = computed(() => modelValue.value.join(' / '))
</script>

<template>
  <v-text-field
    :model-value="text"
    readonly
    :label="props.label"
    :error-messages="props.errorMessages"
  >
    <!-- defineAttrs  -->
    <!-- @vue-ignore -->
    <nested-menu v-model="modelValue" v-bind="$attrs" activator="parent" />
  </v-text-field>
</template>
