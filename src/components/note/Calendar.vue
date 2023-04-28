<script setup lang="ts">
import { addDays, endOfMonth } from 'date-fns'

const { locale } = useI18n()

interface Cell {
  day: number
  date: number
  month: number
  year: number
}

const cellList = ref<Array<Array<Cell>>>([])
const isZH = computed(() => locale.value == 'zh-CN')
const dayIndex = computed(() => isZH.value ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])
const dayName = computed(() => {
  const list = new Array(7).fill(undefined).map((_, index) => addDays(new Date(), index))
  return dayIndex.value.map(i => format(list.find(date => date.getDay() == i)!, 'E'))
})

const [DefineMonth, ReuseMonth] = createReusableTemplate<{ list: Array<Cell>; month: number }>()

function generate(year: number) {
  const list: Array<Array<Cell>> = []
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const month = new Date(year, monthIndex)
    const endDate = endOfMonth(month).getDate()
    const monthList: Array<Cell> = []
    const startIndex = dayIndex.value.indexOf(new Date(year, monthIndex, 1).getDay())
    for (let i = 0; i < startIndex; i++) {
      monthList.push({
        day: 0,
        date: 0,
        month: 0,
        year: 0,
      })
    }
    for (let date = 1; date <= endDate; date++) {
      const now = new Date(year, monthIndex, date)
      const day = now.getDay()
      monthList.push({
        day,
        date: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
    }
    list.push(monthList)
  }
  return list
}

function init() {
  cellList.value = generate(new Date().getFullYear())
}

init()
</script>

<template>
  <DefineMonth v-slot="{ list, month }">
    <div w-64 h-64 p-4>
      <div h-8 text-6>
        {{ format(new Date().setMonth(month), 'MMM') }}
      </div>
      <div v-for="day in dayName" :key="day" w-8 h-8 inline-flex justify-center items-center>
        {{ day }}
      </div>
      <div
        v-for="{ date, year } in list" :key="date" :class="{
          invisible: year == 0,
        }" w-8 h-8 inline-flex justify-center items-center hover:bg-gray-100 cursor-pointer rounded-full
      >
        {{ date }}
      </div>
    </div>
  </DefineMonth>
  <div bg-white>
    <ReuseMonth v-for="month, index in cellList" :key="index" :list="month" :month="index" />
  </div>
</template>
