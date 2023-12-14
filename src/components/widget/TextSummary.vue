<script setup lang="ts">
import { isAfter, isSameDay, subDays } from 'date-fns'
import { type SelectActivity, type SelectNote, type SelectOverview, db } from '@/modules/database'

const props = defineProps<{
  data: SelectOverview['data']
}>()

const { formatHHmmss } = useDateFns()

const offset = 30

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const day = ref(offset)
const clockIn = ref(0)
const totalTime = ref(0)

const range = computed(() => generateRange(day.value))
const title = computed(() => props.data.widget?.title as string)

const list = computed(() => {
  return noteList.value.length > 0
    ? splitByDay(noteList.value, range.value).map(i => ({
      start: i.start,
      end: i.end,
      name: i.plan.name,
      color: i.plan.color,
    }))
    : splitByDay(activityList.value, range.value).map(i => ({
      start: i.start,
      end: i.end,
      name: i.program.name,
      color: i.program.color,
    }))
})

const clockInAverage = computed(() => totalTime.value / clockIn.value)

const lastMonthAverage = computed(() => {
  const [start] = generateRange(offset)
  const items = list.value.filter(i => isAfter(i.start, start))
  const totalTime = calcTotalTime(items)
  return totalTime / offset
})

async function init() {
  noteList.value = activityList.value = []
  const { query } = props.data
  if (!query)
    return

  const { table, where } = query
  const [start, end] = range.value
  const condition = {
    ...where,
    start: start.getTime(),
    end: end.getTime(),
  }
  if (table == db.note.table)
    noteList.value = await db.note.select(condition)

  else if (table == db.activity.table)
    activityList.value = await db.activity.select(condition)

  let date = end
  clockIn.value = totalTime.value = 0

  while (isAfter(date, start)) {
    const items = list.value.filter(i => isSameDay(i.start, date))
    if (items.length == 0)
      return

    clockIn.value++
    totalTime.value += calcTotalTime(items)

    date = subDays(date, 1)
  }

  day.value += offset

  init()
}

watch(() => props.data, () => {
  day.value = offset
  init()
}, {
  deep: true,
  immediate: true,
})
</script>

<template>
  <div>
    <div mb-2>
      {{ title }}
    </div>
    <div grid grid-cols-2 gap-4>
      <div>
        <div text-5 mb-2>
          {{ $t('widget.textSummary.clockIn') }}
        </div>
        <div>{{ $t('widget.textSummary.day', { day: clockIn }) }}</div>
      </div>
      <div>
        <div text-5 mb-2>
          {{ $t('widget.textSummary.average') }}
        </div>
        <div>{{ formatHHmmss(clockInAverage) }}</div>
      </div>
      <div col-span-full>
        <div text-5 mb-2>
          {{ $t('widget.textSummary.monthAverage') }}
        </div>
        <div>{{ formatHHmmss(lastMonthAverage) }}</div>
      </div>
    </div>
  </div>
</template>
