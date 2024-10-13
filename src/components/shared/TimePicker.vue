<script setup lang="ts">
import { set } from 'date-fns'

const props = defineProps<{
  modelValue: string

}>()

const { modelValue } = useVModels(props)
const { format } = useDateFns()

function updateModelValue(value: { hour?: number; minute?: number; second?: number }) {
  const { hour, minute, second } = value
  const [h, m, s] = modelValue.value.split(':').map(Number)
  const date = set(new Date(), {
    hours: hour ?? h,
    minutes: minute ?? m,
    seconds: second ?? s,
  })
  modelValue.value = format(date, 'HH:mm:ss')
}
</script>

<template>
  <v-time-picker
    v-model="modelValue" color="primary" format="24hr" use-seconds
    @update:hour="(hour) => updateModelValue({ hour })"
    @update:minute="(minute) => updateModelValue({ minute })"
    @update:second="(second) => updateModelValue({ second })"
  >
    <template #actions>
      <slot name="actions" />
    </template>
  </v-time-picker>
</template>
