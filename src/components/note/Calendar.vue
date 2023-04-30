<script setup lang="ts">
import { endOfMonth } from 'date-fns'

const { locale } = useI18n()

interface Cell {
  day: number
  date: number
  month: number
  year: number
  visible: boolean
}

type MonthCell = Array<Cell>

type CalendarMode = 'month' | 'year'

const cellList = ref<Array<MonthCell>>([])
const mode = ref<CalendarMode>('month')
const calendarMonthList = ref<Array<HTMLElement>>([])
const scrollCalendar = ref<HTMLElement>()
const currentYear = ref(new Date().getFullYear())

const cellYearList = computed(() => {
  const list: Array<Array<MonthCell>> = []
  let temp: Array<MonthCell> = []
  for (let i = 0; i < cellList.value.length; i++) {
    temp.push(cellList.value[i])
    if (temp.length == 12) {
      list.push(temp)
      temp = []
    }
  }
  return list
})
const isMonthMode = computed(() => mode.value == 'month')
const modeName = computed(() => isMonthMode.value ? '年' : '月')

const isZH = computed(() => locale.value == 'zh-CN')
const dayIndex = computed(() => isZH.value ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])
const dayMap = {
  'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
  'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
const dayName = computed(() => {
  return dayIndex.value.map(i => dayMap[locale.value][i])
})

const { arrivedState } = useScroll(scrollCalendar, {
  offset: { top: 30, bottom: 30 },
})

const { right, left, y, height } = useElementBounding(scrollCalendar)
const point = computed(() => ({
  x: (left.value + right.value) / 2,
  y: y.value + height.value / 4,
}))

const [DefineMonth, ReuseMonth] = createReusableTemplate<{ list: MonthCell }>()

function generate(year: number) {
  const list: Array<MonthCell> = []
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const month = new Date(year, monthIndex)
    const endDate = endOfMonth(month).getDate()
    const monthList: MonthCell = []
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

function getInfo(monthList: MonthCell) {
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

function toggleMode() {
  mode.value = mode.value == 'month' ? 'year' : 'month'
}

function handleScroll() {
  setCurrentYear()
}

function setCurrentYear() {
  const list = document.elementsFromPoint(point.value.x, point.value.y) as HTMLElement[]
  for (const node of list) {
    if (node.dataset.year)
      currentYear.value = Number(node.dataset.year)
  }
}

function colorLevel(time: number) {
  const { hour } = extractTime(time).raw
  if (hour == 0)
    return ''

  if (hour < 1)
    return 'bg-green-3'

  else if (hour < 2)
    return 'bg-green-4'

  else if (hour < 3)
    return 'bg-green-5'

  else if (hour < 6)
    return 'bg-green-6'

  else
    return 'bg-green-7'
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

watch(mode, setCurrentYear, {
  flush: 'post',
})
</script>

<template>
  <DefineMonth v-slot="{ list }">
    <div
      :ref="el => calendarMonthList.push(el as HTMLElement)" w-20em :data-month="getInfo(list).month"
      :data-year="getInfo(list).year"
      :class="isMonthMode ? 'p-1.25em' : 'px-1.25em py-0.5em'"
    >
      <div
        h-2em text-1.25em font-bold
      >
        {{ format(new Date('2023-1-1').setMonth(getInfo(list).month), 'MMM') }}
      </div>
      <div
        v-for="{ date, visible } in list" :key="date" :class="{
          invisible: !visible,
        }" w-2.5em h-2.5em inline-flex justify-center items-center hover:opacity-80 cursor-pointer rounded-full relative
      >
        <div
          w-full h-full
          flex justify-center items-center
          :class="{
            'scale-80': !isMonthMode,
          }"
        >
          {{ date }}
        </div>
        <div v-if="isMonthMode" absolute w-0.25em h-0.25em rounded-full bottom-4px />
      </div>
    </div>
  </DefineMonth>
  <div
    ref="scrollCalendar" bg-white h-full overflow-y-auto overflow-x-hidden :style="{
      fontSize: isMonthMode ? '18px' : '6px',
    }"
    @scroll="handleScroll"
  >
    <div sticky top-0 bg-white shadow px-1.25em z-1>
      <div flex justify-between items-center>
        <div text-7 font-bold>
          {{ format(new Date().setFullYear(currentYear), 'yyyy') }}
        </div>
        <div cursor-pointer @click="toggleMode">
          {{ modeName }}
        </div>
      </div>
      <div v-for="day in dayName" v-show="isMonthMode" :key="day" w-45px h-45px inline-flex justify-center items-center>
        {{ day }}
      </div>
    </div>
    <template v-if="isMonthMode">
      <ReuseMonth v-for="monthList, in cellList" :key="getInfo(monthList).year" :list="monthList" />
    </template>
    <template v-else>
      <div
        v-for="yearList, in cellYearList" :key="getInfo(yearList[0]).year" :class="{
          'grid': !isMonthMode,
          'grid-cols-3': !isMonthMode,
        }"
        w-360px
        border-t
      >
        <ReuseMonth v-for="monthList, in yearList" :key="getInfo(monthList).year" :list="monthList" />
      </div>
    </template>
  </div>
</template>
