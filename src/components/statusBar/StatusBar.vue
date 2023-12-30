<script setup lang="ts">
const timeStore = useTimerStore()
const { time, running, text } = storeToRefs(timeStore)

const route = useRoute()
const { xs, sm } = useTailwindBreakpoints()

const timerText = computed(() => route.fullPath == '/timer' ? text.value : `#${text.value}# ${time.value}`)
</script>

<template>
  <div v-show="xs" id="status-bar-xs" px-4 flex h-full items-center relative />
  <div v-show="sm" id="status-bar-sm" px-4 flex>
    <div flex-1 />
    <tooltip-button v-if="running" :tooltip="$t('statusBar.timer')" location="top" :text="timerText" variant="text" />
  </div>
</template>
