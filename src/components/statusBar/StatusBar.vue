<script setup lang="ts">
const timeStore = useTimerStore()
const { time, running, text } = storeToRefs(timeStore)

const route = useRoute()
const { xs, sm } = useTailwindBreakpoints()
const router = useRouter()
const { refresh, registered, loading } = usePageRefresh()
const { dragged, isGrid, toggleDrag } = layoutInject()

const timerText = computed(() => route.fullPath == '/record/timer' ? text.value : `#${text.value}# ${time.value}`)

function navigateTimer() {
  router.push('/record/timer')
}
</script>

<template>
  <div v-show="xs" id="status-bar-xs" px-4 flex h-full items-center relative />
  <div v-show="sm" px-4 flex items-center>
    <div flex-1 />
    <div id="status-bar-sm" flex items-center />
    <status-bar-button
      v-if="running" :tooltip="$t('statusBar.timer')" :text="timerText" icon="i-mdi:timer-outline"
      @click="navigateTimer"
    />
    <status-bar-button
      v-if="isGrid"
      :tooltip="dragged ? $t('statusBar.drag.tooltip.lock') : $t('statusBar.drag.tooltip.unlock')"
      :text="$t('statusBar.drag.text')" :icon="dragged ? 'i-mdi:lock-open-variant-outline' : 'i-mdi:lock-outline'"
      @click="() => toggleDrag()"
    />
    <status-bar-button
      v-if="registered" :tooltip="$t('statusBar.refresh.tooltip')" :text="$t('statusBar.refresh.text')"
      :loading="loading" icon="i-mdi:refresh" loader-icon="i-mdi:refresh animate-spin animate-duration-300"
      @click="() => refresh()"
    />
  </div>
</template>
