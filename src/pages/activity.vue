<script setup lang="ts">
import { isToday } from 'date-fns'
import DatePicker from 'ant-design-vue/es/date-picker/date-fns'

import type { Activity } from '@interfaces/index'

const store = useActivity()
const { activityList } = storeToRefs(store)

const date = ref(new Date())
const queryActivityList = ref<Activity[]>([])

const isOpenLog = ref(false)

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
      <DatePicker v-model:value="date" input-read-only :allow-clear="false" />
      <a-button v-if="showList.length" type="primary" @click="openLog">
        {{ $t('activity.detail') }}
      </a-button>
    </div>
    <ActivityLineChart v-if="showList.length" v-model:is-open-log="isOpenLog" :show-list="showList" />
    <a-empty v-else h-full flex flex-col justify-center />
  </div>
</template>
