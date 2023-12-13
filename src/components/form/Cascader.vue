<script setup lang="ts">
import type { NestedMenuItem, NestedMenuItemValue } from '@/interfaces'

const props = withDefaults(defineProps<{
  modelValue?: Array<NestedMenuItemValue>
  label: string
  errorMessages?: string
}>(), {
  modelValue: () => [],
})

defineEmits(['update:modelValue'])

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const { modelValue } = useVModels(props)

const text = computed(() => getText(modelValue.value, attrs.items as any).join(' / '))

function getText(target: Array<NestedMenuItemValue>, items: Array<NestedMenuItem>, result: Array<string> = []) {
  const [value, ...rest] = target
  const item = items.find(i => i.value === value)
  if (item) {
    result.push(item.title)

    if (item.children && item.children.length > 0)
      getText(rest, item.children, result)
  }
  return result
}
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
