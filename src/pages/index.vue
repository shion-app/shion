<script setup lang="ts">
import { endOfDay, subDays } from 'date-fns'
import { appWindow } from '@tauri-apps/api/window'
import { TauriEvent } from '@tauri-apps/api/event'

import { type SelectActivity, type SelectNote } from '@modules/database'
import { db } from '@modules/database'

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])
const range = ref<'month' | 'week'>('week')
const mode = ref<'plan' | 'label'>('plan')
const unit = ref<'date' | 'hour'>('date')

const day = computed(() => range.value == 'week' ? 7 : 31)
const isShowChart = computed(() => noteList.value.length > 0 || activityList.value.length > 0)
const isShowRangeRadio = computed(() => unit.value == 'date')

async function refresh() {
  refreshNote()
  refreshActivity()
}

function transformDayToRange(day: number, date = new Date()) {
  const start = endOfDay(subDays(date, day)).getTime()
  const end = endOfDay(date).getTime()
  return [start, end]
}

async function refreshNote() {
  const [start, end] = transformDayToRange(day.value)
  noteList.value = await db.note.select({
    start, end,
  })
}

async function refreshActivity() {
  const [start, end] = transformDayToRange(day.value)
  activityList.value = await db.activity.select({
    start, end,
  })
}

function returnPrev() {
  unit.value = 'date'
}

const refreshThrottle = useThrottleFn(refresh, 100)

useTauriListen(TauriEvent.WINDOW_FOCUS, async () => {
  const visible = await appWindow.isVisible()
  if (visible)
    refreshThrottle()
})

watch(range, refreshThrottle, {
  immediate: true,
})
</script>

<template>
  <div h-full relative overflow-hidden>
    <template v-if="isShowChart">
      <div absolute z-1 flex w-full p-2 space-x-2>
        <div v-if="unit == 'hour'">
          <a-button type="primary" shape="round" size="small" @click="returnPrev">
            <div i-mdi:arrow-left text-4 />
          </a-button>
        </div>
        <div flex-1 />
        <a-radio-group v-if="isShowRangeRadio" v-model:value="range" size="small">
          <a-radio-button value="week">
            <a-tooltip :title="$t('overview.week')">
              <div h-full flex items-center>
                <div i-mdi:calendar-week text-4 />
              </div>
            </a-tooltip>
          </a-radio-button>
          <a-radio-button value="month">
            <a-tooltip :title="$t('overview.month')">
              <div h-full flex items-center>
                <div i-mdi:calendar-month text-4 />
              </div>
            </a-tooltip>
          </a-radio-button>
        </a-radio-group>
        <a-radio-group v-model:value="mode" size="small">
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
      <OverviewChart v-model:unit="unit" :note-list="noteList" :activity-list="activityList" :mode="mode" :day="day" />
    </template>
    <a-empty v-else h-full flex flex-col justify-center />
  </div>
</template>
