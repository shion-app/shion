<script setup lang="ts">
import { endOfDay, subDays } from 'date-fns'
import { appWindow } from '@tauri-apps/api/window'
import { TauriEvent } from '@tauri-apps/api/event'

import { type SelectActivity, type SelectNote } from '@/modules/database'
import { db } from '@/modules/database'

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
          <v-btn @click="returnPrev">
            <div i-mdi:arrow-left text-4 />
          </v-btn>
        </div>
        <div flex-1 />
        <v-btn-toggle v-if="isShowRangeRadio" v-model="range">
          <v-tooltip :text="$t('overview.week')" location="bottom">
            <template #activator="{ props }">
              <v-btn icon="mdi-calendar-week" value="week" v-bind="props" size="small" />
            </template>
          </v-tooltip>
          <v-tooltip :text="$t('overview.month')" location="bottom">
            <template #activator="{ props }">
              <v-btn icon="mdi-calendar-month" value="month" v-bind="props" size="small" />
            </template>
          </v-tooltip>
        </v-btn-toggle>
        <v-btn-toggle v-model="mode">
          <v-tooltip :text="$t('overview.plan')" location="bottom">
            <template #activator="{ props }">
              <v-btn icon="mdi-list-box-outline" value="plan" v-bind="props" size="small" />
            </template>
          </v-tooltip>
          <v-tooltip :text="$t('overview.label')" location="bottom">
            <template #activator="{ props }">
              <v-btn icon="mdi-label-outline" value="label" v-bind="props" size="small" />
            </template>
          </v-tooltip>
        </v-btn-toggle>
      </div>
      <OverviewChart v-model:unit="unit" :note-list="noteList" :activity-list="activityList" :mode="mode" :day="day" />
    </template>
    <!-- <a-empty v-else h-full flex flex-col justify-center /> -->
  </div>
</template>
