<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div text-4 font-bold text-center w-full>
    {{ $props.title }}
  </div>
  <div absolute right-0>
    <slot name="append" />
  </div>
</template>
