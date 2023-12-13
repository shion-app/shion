<script setup lang="ts">
const timeStore = useTimerStore()
const { time, running, text } = storeToRefs(timeStore)
const route = useRoute()

const timerText = computed(() => route.fullPath == '/timer' ? text.value : `#${text.value}# ${time.value}`)
</script>

<template>
  <div px-4 flex>
    <div flex-1 />
    <v-btn v-if="running" :text="timerText" variant="text" />
  </div>
</template>
