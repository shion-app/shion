<script setup lang="ts">
import { addDays, endOfMonth } from 'date-fns'

const { locale } = useI18n()

interface Cell {
  day: number
  date: number
  month: number
  year: number
  visible: boolean
}

const cellList = ref<Array<Array<Cell>>>([])
const calendarMonthList = ref<Array<HTMLElement>>([])
const scrollCalendar = ref<HTMLElement>()
const isZH = computed(() => locale.value == 'zh-CN')
const dayIndex = computed(() => isZH.value ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])
const dayName = computed(() => {
  const list = new Array(7).fill(undefined).map((_, index) => addDays(new Date(), index))
  return dayIndex.value.map(i => format(list.find(date => date.getDay() == i)!, 'E'))
})

const { arrivedState } = useScroll(scrollCalendar, {
  offset: { top: 30, bottom: 30 },
})

const [DefineMonth, ReuseMonth] = createReusableTemplate<{ list: Array<Cell> }>()

function generate(year: number) {
  const list: Array<Array<Cell>> = []
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const month = new Date(year, monthIndex)
    const endDate = endOfMonth(month).getDate()
    const monthList: Array<Cell> = []
    const startIndex = dayIndex.value.indexOf(new Date(year, monthIndex, 1).getDay())
    for (let i = startIndex - 1; i >= 0; i--) {
      monthList.push({
        day: 0,
        date: -i,
        month: 0,
        year,
        visible: false,
      })
    }
    for (let date = 1; date <= endDate; date++) {
      const now = new Date(year, monthIndex, date)
      const day = now.getDay()
      monthList.push({
        day,
        date: now.getDate(),
        month: now.getMonth(),
        year: now.getFullYear(),
        visible: true,
      })
    }
    list.push(monthList)
  }
  return list
}

function getInfo(monthList: Array<Cell>) {
  return monthList.at(-1)!
}

function scrollToView() {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const node = calendarMonthList.value.find(i => Number(i.dataset.month) == month && Number(i.dataset.year) == year)
  if (node)
    node.scrollIntoView()
}

function init() {
  cellList.value = generate(new Date().getFullYear())
  onMounted(() => {
    scrollToView()
  })
}

init()

whenever(() => arrivedState.top, () => {
  const first = cellList.value.flat()[0]
  cellList.value.unshift(...generate(first.year - 1))
})

whenever(() => arrivedState.bottom, () => {
  const last = cellList.value.flat().at(-1)!
  cellList.value.push(...generate(last.year + 1))
})
</script>

<template>
  <DefineMonth v-slot="{ list }">
    <div v-if="getInfo(list).month == 0" sticky top-0 bg-white shadow px-4>
      <div text-8 font-bold>
        {{ format(new Date().setFullYear(getInfo(list).year), 'yyyy') }}
      </div>
      <div v-for="day in dayName" :key="day" w-10 h-10 inline-flex justify-center items-center>
        {{ day }}
      </div>
    </div>
    <div :ref="el => calendarMonthList.push(el as HTMLElement)" w-78 p-4 :data-month="getInfo(list).month" :data-year="getInfo(list).year">
      <div h-10 text-5>
        {{ format(new Date('2023-1-1').setMonth(getInfo(list).month), 'MMM') }}
      </div>
      <div
        v-for="{ date, visible } in list" :key="date" :class="{
          invisible: !visible,
        }" w-10 h-10 inline-flex justify-center items-center hover:bg-gray-100 cursor-pointer rounded-full
      >
        {{ date }}
      </div>
    </div>
  </DefineMonth>
  <div ref="scrollCalendar" bg-white h-full overflow-y-auto overflow-x-hidden>
    <ReuseMonth v-for="monthList, in cellList" :key="getInfo(monthList).year" :list="monthList" />
  </div>
</template>
