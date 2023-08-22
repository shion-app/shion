<script setup lang="ts">
import type { RecentActivity, RecentNote } from '@interfaces/database'

const noteList = ref<Array<RecentNote>>([])
const activityList = ref<Array<RecentActivity>>([])
const chartRange = ref<'month' | 'week'>('week')
const chartMode = ref<'plan' | 'label'>('plan')

const day = computed(() => chartRange.value == 'week' ? 7 : 31)

async function refresh() {
  refreshNote()
  refreshActivity()
}

async function refreshNote() {
  noteList.value = await selectRecentNote(day.value)
}

async function refreshActivity() {
  activityList.value = await selectRecentActivity(day.value)
}

watch(chartRange, refresh, {
  immediate: true,
})
</script>

<template>
  <div h-full relative overflow-hidden>
    <template v-if="noteList.length">
      <div absolute z-1 flex w-full p-2 space-x-2>
        <div flex-1 />
        <a-radio-group v-model:value="chartRange" size="small">
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
        <a-radio-group v-model:value="chartMode" size="small">
          <a-radio-button value="plan">
            <a-tooltip :title="$t('overview.plan')">
              <div h-full flex items-center>
                <div i-mdi:format-list-bulleted-type text-4 />
              </div>
            </a-tooltip>
          </a-radio-button>
          <a-radio-button value="label">
            <a-tooltip :title="$t('overview.label')">
              <div h-full flex items-center>
                <div i-mdi:label text-4 />
              </div>
            </a-tooltip>
          </a-radio-button>
        </a-radio-group>
      </div>
      <OverviewChart :note-list="noteList" :activity-list="activityList" :chart-mode="chartMode" :day="day" />
    </template>
    <a-empty v-else h-full flex flex-col justify-center />
  </div>
</template>
