<script setup lang="ts">
import { endOfMonth, isSameDay, isSameMonth, isToday, set } from 'date-fns'

const props = defineProps<{
  year: number
  month: number
  weekdays: number[]
  selected: Date
}>()

const emit = defineEmits<{
  (e: 'inViewport', year: number): void
  (e: 'update:selected', date: Date): void
}>()

const { locale } = useI18n()
const { selected: selectedVModel } = useVModels(props)

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

defineExpose({
  scrollToViewIfThisMonth,
})

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
        <v-btn
          :variant="isToday(item.date) && !isSameDay(props.selected, item.date) ? 'outlined' : 'flat'"
          :color="isSameDay(props.selected, item.date) || isToday(item.date) ? 'primary' : ''"
          icon
          :ripple="false"
          @click="selectDate(item)"
        >
          {{ item.date.getDate() }}
        </v-btn>
      </div>
    </div>
  </div>
</template>