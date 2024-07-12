<script setup lang="ts">
import { endOfDay, isAfter, isBefore, isSameDay, set, startOfDay } from 'date-fns'

const props = withDefaults(defineProps<{
  min?: number
  max?: number
  modelValue?: number
}>(), {
  modelValue: new Date().getTime(),
})

defineOptions({
  inheritAttrs: false,
})

const { modelValue } = useVModels(props)
const { format } = useDateFns()

const menu = ref(false)
const isDateMenu = ref(true)

const text = computed(() => format(modelValue.value, 'yyyy-MM-dd HH:mm:ss'))
const dateModel = computed({
  set: (v) => {
    modelValue.value = v.getTime()
  },
  get: () => new Date(modelValue.value),
})
const minDate = computed(() => props.min ? startOfDay(props.min) : undefined)
const maxDate = computed(() => props.max ? endOfDay(props.max) : undefined)
const timeModel = computed({
  set: (v) => {
    const [h, m] = v.split(':')
    const date = set(new Date(modelValue.value), {
      hours: Number(h),
      minutes: Number(m),
    })
    modelValue.value = date.getTime()
  },
  get: () => format(modelValue.value, 'HH:mm'),
})
const minTime = computed(() => (props.min && isSameDay(modelValue.value, props.min)) ? format(props.min, 'HH:mm') : undefined)
const maxTime = computed(() => (props.max && isSameDay(modelValue.value, props.max)) ? format(props.max, 'HH:mm') : undefined)

function onClick(date: boolean) {
  menu.value = true
  isDateMenu.value = date
}

function onSave() {
  menu.value = false
}

watch(dateModel, (v) => {
  if (props.min && isBefore(v, props.min))
    modelValue.value = props.min

  if (props.max && isAfter(v, props.max))
    modelValue.value = props.max
})
</script>

<template>
  <v-text-field
    :model-value="text" readonly prepend-inner-icon="mdi-calendar" append-inner-icon="mdi-clock"
    v-bind="$attrs" @click:prepend-inner="onClick(true)" @click:append-inner="onClick(false)"
  />
  <advanced-dialog v-model:visible="menu" class="w-[500px]!">
    <v-confirm-edit v-if="isDateMenu" v-model="dateModel" @save="onSave" @cancel="onSave">
      <template #default="{ model: proxyModel, actions }">
        <v-date-picker v-model="proxyModel.value" color="primary" :min="minDate" :max="maxDate" class="w-full!">
          <template #actions>
            <component :is="actions" />
          </template>
        </v-date-picker>
      </template>
    </v-confirm-edit>
    <v-confirm-edit v-else v-model="timeModel" @save="onSave" @cancel="onSave">
      <template #default="{ model: proxyModel, actions }">
        <v-time-picker
          v-model="proxyModel.value" color="primary" format="24hr" :min="minTime" :max="maxTime"
          class="w-full!"
        >
          <template #actions>
            <component :is="actions" />
          </template>
        </v-time-picker>
      </template>
    </v-confirm-edit>
  </advanced-dialog>
</template>
