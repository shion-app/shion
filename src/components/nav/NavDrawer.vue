<script setup lang="ts">
import classNames from 'classnames'

const props = defineProps<{
  modelValue: boolean
}>()

defineEmits(['update:modelValue'])

const { modelValue } = useVModels(props)

const expanded = ref(false)

watchDebounced(expanded, (v) => {
  modelValue.value = v
}, {
  debounce: 100,
})
</script>

<template>
  <div relative h-full @mouseleave="expanded = false">
    <div uno-card h-full z-100 relative>
      <slot />
    </div>
    <div
      absolute
      :class="classNames('w-[180px] elevation-4 z-99', modelValue ? 'translate-x-[190px]' : '-translate-x-[190px]')"
      transition-transform duration-300 top-0 bottom-0 right-0 rounded-r-lg uno-card-surface @mouseenter="expanded = true"
    >
      <slot name="menu" />
    </div>
  </div>
</template>
