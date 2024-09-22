<script setup lang="ts">
const timeStore = useTimerStore()
const historyStore = useHistoryStore()

const { time, running, text } = storeToRefs(timeStore)
const { requesting, progress } = storeToRefs(historyStore)

const route = useRoute()
const { xs, sm } = useTailwindBreakpoints()
const router = useRouter()
const { refresh, registered, loading } = usePageRefresh()
const { dragged, isGrid, toggleDrag } = layoutInject()

const timerText = computed(() => route.fullPath == '/timer' ? text.value : `#${text.value}# ${time.value}`)

function navigateTimer() {
  router.push('/timer')
}
</script>

<template>
  <div v-show="xs" id="status-bar-xs" px-4 flex h-full items-center relative />
  <div v-show="sm" px-4 flex items-center>
    <div flex-1 />
    <status-bar-button v-if="requesting" :tooltip="$t('statusBar.timeline.history.tooltip')">
      <div flex items-center space-x-1>
        <div>{{ $t('statusBar.timeline.history.text') }}</div>
        <div class="w-[60px]">
          <v-progress-linear color="primary" :model-value="progress" rounded height="8" />
        </div>
      </div>
    </status-bar-button>
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
