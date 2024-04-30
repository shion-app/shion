<script setup lang="ts">
const historyStore = useHistoryStore()

const { requesting, progress } = storeToRefs(historyStore)
</script>

<template>
  <status-bar-button
    v-if="requesting && progress > 0" :tooltip="$t('statusBar.timeline.history.tooltip')"
    class="-order-1"
  >
    <div flex items-center space-x-1>
      <div>{{ $t('statusBar.timeline.history.text') }}</div>
      <div class="w-[60px]">
        <v-progress-linear color="primary" :model-value="progress" rounded height="8" />
      </div>
    </div>
  </status-bar-button>
</template>
