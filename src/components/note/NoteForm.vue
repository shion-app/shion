<script setup lang="ts">
import type { Note } from '@interfaces/index'

import { RangePicker } from 'ant-design-vue/es/date-picker/date-fns'
import 'ant-design-vue/es/date-picker/style/index.less'

const props = defineProps<{
  defaultValue: Note
}>()

const emit = defineEmits(['finish', 'cancel'])

const { defaultValue: model } = useVModels(props)

const range = computed<[Date, Date]>({
  get() {
    return [new Date(model.value.startTime), new Date(model.value.endTime)]
  },
  set([a, b]) {
    model.value.startTime = a.getTime()
    model.value.endTime = b.getTime()
  },
})

function finish() {
  const { startTime, endTime, description } = model.value
  emit('finish', { startTime, endTime, description })
}
</script>

<template>
  <modal-form :model="model" @finish="finish" @cancel="() => $emit('cancel')">
    <a-form-item :label="$t('note.update.timeRange')">
      <RangePicker
        v-model:value="range"
        :allow-clear="false"
        :show-time="{ format: 'HH:mm' }"
        format="YYYY-MM-DD HH:mm"
      />
    </a-form-item>
    <a-form-item :label="$t('note.update.description')">
      <a-input v-model:value="model.description" />
    </a-form-item>
  </modal-form>
</template>
