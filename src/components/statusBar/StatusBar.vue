<script setup lang="ts">
const timeStore = useTimerStore()
const { time, running, text } = storeToRefs(timeStore)

const route = useRoute()
const { xs, sm } = useTailwindBreakpoints()
const router = useRouter()
const { refresh, registered } = usePageRefresh()
const { dragged, isGrid, toggleDrag } = layoutInject()

const timerText = computed(() => route.fullPath == '/timer' ? text.value : `#${text.value}# ${time.value}`)

function navigateTimer() {
  router.push('/timer')
}
</script>

<template>
  <div v-show="xs" id="status-bar-xs" px-4 flex h-full items-center relative />
  <div v-show="sm" id="status-bar-sm" px-4 flex>
    <div flex-1 />
    <tooltip-button
      v-if="running"
      :tooltip="$t('statusBar.timer')"
      location="top"
      :text="timerText"
      variant="text"
      @click="navigateTimer"
    />
    <v-tooltip :text="dragged ? $t('statusBar.lock') : $t('statusBar.unlock')" location="top">
      <template #activator="{ props }">
        <v-btn
          v-if="isGrid"
          v-bind="props"
          variant="text"
          @click="() => toggleDrag()"
        >
          <div :class="dragged ? 'i-mdi:lock-open-variant-outline' : 'i-mdi:lock-outline'" text-6 />
        </v-btn>
      </template>
    </v-tooltip>
    <v-tooltip :text="$t('statusBar.refresh')" location="top">
      <template #activator="{ props }">
        <v-btn
          v-if="registered"
          v-bind="props"
          variant="text"
          @click="() => refresh()"
        >
          <div class="i-mdi:refresh" text-6 />
        </v-btn>
      </template>
    </v-tooltip>
  </div>
</template>
