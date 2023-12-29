<script setup lang="ts">
const { sm } = useTailwindBreakpoints()
</script>

<template>
  <teleport v-if="sm" to="#status-bar">
    <slot />
  </teleport>
  <div v-else />
</template>
