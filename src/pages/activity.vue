<script setup lang="ts">
import { isToday } from 'date-fns'
import DatePicker from 'ant-design-vue/es/date-picker/date-fns'

import type { Activity } from '@interfaces/index'

const store = useActivity()
const { activityList } = storeToRefs(store)

const date = ref(new Date())
const queryActivityList = ref<Activity[]>([])
const isOpenLog = ref(false)
const chartType = ref<'line' | 'bar'>('line')

const isDateToday = computed(() => isToday(date.value))
const showList = computed(() => isDateToday.value ? activityList.value : queryActivityList.value)

function openLog() {
  isOpenLog.value = true
}

watch(date, async (v) => {
  queryActivityList.value = await selectActivity(v)
})
</script>

<template>
  <div h-full relative overflow-hidden>
    <div absolute z-1 flex w-full p-2 space-x-2>
      <div flex-1 />
      <a-radio-group v-if="showList.length" v-model:value="chartType" size="small">
        <a-radio-button value="line">
          <a-tooltip :title="$t('activity.line')">
            <div h-full flex items-center>
              <div i-mdi:chart-line-variant text-4 />
            </div>
          </a-tooltip>
        </a-radio-button>
        <a-radio-button value="bar">
          <a-tooltip :title="$t('activity.bar')">
            <div h-full flex items-center>
              <div i-mdi:poll text-4 />
            </div>
          </a-tooltip>
        </a-radio-button>
      </a-radio-group>
      <a-button v-if="showList.length && chartType == 'line'" type="primary" @click="openLog">
        {{ $t('activity.detail') }}
      </a-button>
      <DatePicker v-model:value="date" input-read-only :allow-clear="false" />
    </div>
    <template v-if="showList.length">
      <ActivityLineChart v-if="chartType == 'line'" v-model:is-open-log="isOpenLog" :show-list="showList" />
      <ActivityBarChart v-else-if="chartType == 'bar'" :show-list="showList" />
    </template>
    <a-empty v-else h-full flex flex-col justify-center />
  </div>
</template>
