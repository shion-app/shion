<script setup lang="ts">
const props = defineProps<{
  date: Date
}>()

const { date: dateVModel } = useVModels(props)

const { locale } = useI18n()

interface CalendarMonthType {
  year: number
  month: number
}

const dayMap = {
  'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
  'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
let generatedYear = new Date().getFullYear()

const list = ref<Array<CalendarMonthType>>([])
const currentYear = ref(new Date().getFullYear())

const calendarMonthRef = useTemplateRefsList<{
  scrollToViewIfThisMonth(date: Date): void
}>()
const scrollContainer = templateRef<HTMLElement>('scrollContainer')

const weekdays = computed(() => locale.value == 'zh-CN' ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])
const weekdaysName = computed(() => weekdays.value.map(i => dayMap[locale.value][i]))

const { arrivedState } = useScroll(scrollContainer, {
  offset: { top: 30 },
  throttle: 60,
  onScroll,
})

function generate(year: number) {
  const array: Array<CalendarMonthType> = []
  for (let i = 1; i <= 12; i++) {
    array.push({
      year,
      month: i,
    })
  }
  return array
}

function init() {
  const year = new Date().getFullYear()
  list.value = [...generate(year - 1), ...generate(year)]
  generatedYear = year - 1
}

function scrollToView() {
  for (const item of calendarMonthRef.value)
    item.scrollToViewIfThisMonth(new Date())
}

function handleSelectDate(date: Date) {
  dateVModel.value = date
}

function onScroll() {
  const { top } = arrivedState
  if (top)
    list.value.unshift(...generate(--generatedYear))
}

init()

onMounted(scrollToView)
</script>

<template>
  <div ref="scrollContainer" h-full overflow-y-auto overflow-x-hidden relative ml-2>
    <div sticky top-0 left-0 right-0 bg-white z-1 shadow>
      <div text-5>
        {{ currentYear }}
      </div>
      <div flex>
        <div v-for="name in weekdaysName" :key="name" w-12 h-12 flex justify-center items-center>
          {{ name }}
        </div>
      </div>
    </div>
    <CalendarMonth
      v-for="{ year, month } in list"
      :ref="calendarMonthRef.set"
      :key="`${year}-${month}`"
      v-model:selected="dateVModel" :year="year" :month="month" :weekdays="weekdays"
      @select="handleSelectDate"
      @in-viewport="year => currentYear = year"
    />
  </div>
</template>
