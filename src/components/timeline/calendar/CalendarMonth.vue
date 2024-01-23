<script setup lang="ts">
import { endOfMonth, isSameDay, isSameMonth, isToday, set } from 'date-fns'
import { UseElementVisibility } from '@vueuse/components'

const props = withDefaults(defineProps<{
  year: number
  month: number
  weekdays: number[]
  selected: Date
  activeStatusMap: Map<string, { color: string; time: number }>
}>(), {
  activeStatusMap: () => new Map(),
})

const emit = defineEmits<{
  (e: 'inViewport', year: number): void
  (e: 'update:selected', date: Date): void
}>()

defineExpose({
  scrollToViewIfThisMonth,
})

const { locale } = useI18n()
const { selected: selectedVModel } = useVModels(props)
const { format, formatHHmmss } = useDateFns()

interface CalendarDate {
  date: Date
  visible: boolean
}

const list = ref<Array<CalendarDate>>([])
const target = templateRef<HTMLElement>('target')

useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting)
      emit('inViewport', props.year)
  },
  {
    threshold: 1,
  },
)

const startDate = set(new Date(), {
  year: props.year,
  month: props.month - 1,
  date: 1,
})

const endDate = endOfMonth(startDate)

const monthName = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(startDate))

function generate() {
  const startIndex = props.weekdays.indexOf(startDate.getDay())

  list.value = []

  list.value.push(...new Array(startIndex).fill(0).map(() => ({
    date: new Date(),
    visible: false,
  })))

  for (let i = 1; i <= endDate.getDate(); i++) {
    list.value.push({
      date: set(new Date(), {
        year: props.year,
        month: props.month - 1,
        date: i,
      }),
      visible: true,
    })
  }
}

function selectDate(c: CalendarDate) {
  selectedVModel.value = c.date
}

function scrollToViewIfThisMonth(date: Date) {
  if (isSameMonth(startDate, date))
    target.value.scrollIntoView({ block: 'center' })
}

function get(date: Date) {
  return props.activeStatusMap.get(format(date, 'yyyy-MM-dd'))
}

watchDeep(() => props.weekdays, generate, {
  immediate: true,
})
</script>

<template>
  <div ref="target" w-fit mt-8>
    <div text-6 px-2>
      {{ monthName }}
    </div>
    <div grid grid-cols-7 w-84 gap-y-2>
      <div
        v-for="item in list" :key="format(item.date, 'yyyy-MM-dd')"
        w-12 h-12 flex justify-center items-center
        :class="{
          invisible: !item.visible,
        }"
      >
        <UseElementVisibility v-slot="{ isVisible }">
          <v-btn
            :variant="isToday(item.date) && !isSameDay(props.selected, item.date) ? 'outlined' : 'flat'"
            :color="isSameDay(props.selected, item.date) || isToday(item.date) ? 'primary' : get(item.date)?.color"
            icon
            :ripple="false"
            @click="selectDate(item)"
          >
            {{ item.date.getDate() }}
            <v-tooltip v-if="isVisible && get(item.date)?.time" location="bottom" :text="formatHHmmss(get(item.date)?.time || 0)" activator="parent" />
          </v-btn>
        </UseElementVisibility>
      </div>
    </div>
  </div>
</template>
