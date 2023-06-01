<script setup lang="ts">
const store = useTime()

const { time, isCountdownOver, countdown } = storeToRefs(store)
</script>

<template>
  <div
    font-mono :class="{
      'text-red-6': countdown && !isCountdownOver,
      'text-green-6': countdown && isCountdownOver,
    }"
  >
    {{ time }}
  </div>
</template>
