<script setup lang="ts">
const props = withDefaults(defineProps<{
  xs?: boolean
}>(), {
  xs: true,
})

const breakpoint = computed(() => props.xs ? 'xs' : 'sm')
</script>

<template>
  <teleport :to="`#status-bar-${breakpoint}`">
    <slot />
  </teleport>
</template>
