<script setup lang="ts">
import type { RecentNote } from '@interfaces/database'

const list = ref<Array<RecentNote>>([])

const chartType = ref<'month' | 'week'>('week')
const day = computed(() => chartType.value == 'week' ? 7 : 31)

async function refresh() {
  list.value = await selectRecentNote(day.value)
}

watch(chartType, refresh, {
  immediate: true,
})
</script>

<template>
  <div h-full relative overflow-hidden>
    <template v-if="list.length">
      <div absolute z-1 flex w-full p-2 space-x-2>
        <div flex-1 />
        <a-radio-group v-model:value="chartType" size="small">
          <a-radio-button value="week">
            <a-tooltip :title="$t('overview.week')">
              <div h-full flex items-center>
                <div i-mdi:view-split-vertical text-4 />
              </div>
            </a-tooltip>
          </a-radio-button>
          <a-radio-button value="month">
            <a-tooltip :title="$t('overview.month')">
              <div h-full flex items-center>
                <div i-mdi:view-split-horizontal text-4 />
              </div>
            </a-tooltip>
          </a-radio-button>
        </a-radio-group>
      </div>
      <OverviewChart :list="list" :day="day" />
    </template>
    <a-empty v-else h-full flex flex-col justify-center />
  </div>
</template>
