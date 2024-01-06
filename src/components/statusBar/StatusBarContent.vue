<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div text-center w-full>
    {{ $props.title }}
  </div>
  <div absolute right-0>
    <slot name="append" />
  </div>
</template>
