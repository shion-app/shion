<script setup lang="ts">
import { endOfMonth } from 'date-fns'
import classNames from 'classnames'
import type { CSSProperties } from 'vue'

defineProps<{
  data: Map<string, {
    total: number
    colors: string[]
  }>
}>()

const emit = defineEmits<{
  (e: 'refresh', range: Array<number>): void
  (e: 'click', date: Date): void
}>()

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
const calendarMonthRef = useTemplateRefsList<HTMLElement>()
const scrollCalendarRef = ref<HTMLElement>()
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const isScrollToView = ref(false)

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
const isZH = computed(() => locale.value == 'zh-CN')
const dayIndex = computed(() => isZH.value ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])
const dayMap = {
  'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
  'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
const dayName = computed(() => {
  return dayIndex.value.map(i => dayMap[locale.value][i])
})

const { arrivedState } = useScroll(scrollCalendarRef, {
  offset: { top: 30, bottom: 30 },
})
const { right, left, y, height } = useElementBounding(scrollCalendarRef)

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

function getCell(monthList: MonthCell) {
  return monthList.at(-1)!
}

function scrollToView() {
  const node = calendarMonthRef.value.find(i => Number(i.dataset.month) == currentMonth.value && Number(i.dataset.year) == currentYear.value)
  if (node) {
    isScrollToView.value = true
    node.scrollIntoView()
    nextTick(() => {
      isScrollToView.value = false
    })
  }
}

async function toggleMode() {
  mode.value = mode.value == 'month' ? 'year' : 'month'
  await nextTick()
  scrollToView()
}

function handleScroll() {
  setCurrentTime()
}

async function setCurrentTime() {
  if (isScrollToView.value)
    return
  const list = document.elementsFromPoint(point.value.x, point.value.y) as HTMLElement[]
  for (const node of list) {
    if (node.dataset.year) {
      currentYear.value = Number(node.dataset.year)
      currentMonth.value = Number(node.dataset.month)
    }
  }
}

function colorLevelStyle(data?: { total: number; colors: string[] }): CSSProperties {
  if (!data)
    return {}

  const { colors } = data
  const ratio = 360 / colors.length

  return {
    background: `conic-gradient(${colors.map((color, index) => `${color} ${index * ratio}deg ${(index + 1) * ratio}deg`).join(', ')})`,
  }
}

function colorLevelClass(data?: { total: number; colors: string[] }) {
  if (!data)
    return 'hover:bg-gray-2'

  const { total } = data

  const hour = total / (60 * 60 * 1000)

  if (hour < 1)
    return 'bg-green-2'

  else if (hour < 2)
    return 'bg-green-3'

  else if (hour < 3)
    return 'bg-green-4'

  else if (hour < 6)
    return 'bg-green-5'

  else
    return 'bg-green-6'
}

function init() {
  cellList.value = [...generate(new Date().getFullYear() - 1), ...generate(new Date().getFullYear())]
}

whenever(() => arrivedState.top, () => {
  const first = cellList.value.flat()[0]
  cellList.value.unshift(...generate(first.year - 1))
})

whenever(() => arrivedState.bottom, () => {
  const last = cellList.value.flat().at(-1)!
  cellList.value.push(...generate(last.year + 1))
})

watch(cellList, (v) => {
  const range = [...new Set(v.flat().map(i => i.year))]
  emit('refresh', range)
}, {
  deep: true,
})

onMounted(scrollToView)

init()
</script>

<template>
  <DefineMonth v-slot="{ list }">
    <div
      :ref="calendarMonthRef.set" w-20em :data-month="getCell(list).month"
      :data-year="getCell(list).year"
      :class="isMonthMode ? 'p-1.25em' : 'px-1.25em py-0.5em'"
    >
      <div
        h-2em text-1.25em font-bold
      >
        {{ format(new Date('2023-1-1').setMonth(getCell(list).month), 'MMM') }}
      </div>
      <div
        v-for="{ date, year, month, visible } in list" :key="date"
        :class="classNames(colorLevelClass(data.get(`${year}-${month}-${date}`)), {
          invisible: !visible,
        })"
        :style="isMonthMode ? colorLevelStyle(data.get(`${year}-${month}-${date}`)) : {}"
        w-2.5em h-2.5em inline-flex justify-center items-center
        hover:opacity-80 opacity-100 transition-opacity cursor-pointer rounded-full relative
        @click="emit('click', new Date(year, month, date))"
      >
        <a-tooltip>
          <template #title>
            <span>{{ formatHHmmss(data.get(`${year}-${month}-${date}`)?.total || 0) }}</span>
          </template>
          <div
            w-full h-full
            flex justify-center items-center
            :class="{
              'scale-80': !isMonthMode,
            }"
          >
            {{ date }}
          </div>
        </a-tooltip>
      </div>
    </div>
  </DefineMonth>
  <div
    h-full flex flex-col bg-white :style="{
      fontSize: isMonthMode ? '18px' : '6px',
    }"
  >
    <div shadow>
      <div flex justify-between items-center px-4>
        <div text-7 font-bold>
          {{ format(new Date().setFullYear(currentYear), 'yyyy') }}
        </div>
        <div cursor-pointer @click="toggleMode">
          <a-tooltip placement="bottom">
            <template #title>
              <span>{{ $t('calendar.switch', {
                mode: isMonthMode ? $t('calendar.year') : $t('calendar.month'),
              }) }}</span>
            </template>
            <div :class="classNames(isMonthMode ? 'i-mdi:calendar' : 'i-mdi:calendar-month', isMonthMode ? 'scale-100' : 'scale-300')" origin-right />
          </a-tooltip>
        </div>
      </div>
      <div px-1.25em>
        <div v-for="day in dayName" v-show="isMonthMode" :key="day" w-45px h-45px inline-flex justify-center items-center>
          {{ day }}
        </div>
      </div>
    </div>
    <div
      ref="scrollCalendarRef"
      flex-1 overflow-y-auto overflow-x-hidden
      @scroll="handleScroll"
    >
      <template v-if="isMonthMode">
        <ReuseMonth v-for="monthList, in cellList" :key="getCell(monthList).year" :list="monthList" />
      </template>
      <template v-else>
        <div
          v-for="yearList, in cellYearList" :key="getCell(yearList[0]).year" :class="{
            'grid': !isMonthMode,
            'grid-cols-3': !isMonthMode,
          }"
          w-360px
          border-t
        >
          <ReuseMonth v-for="monthList, in yearList" :key="getCell(monthList).year" :list="monthList" />
        </div>
      </template>
    </div>
  </div>
</template>
