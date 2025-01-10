<script setup lang="ts">
import { addDays, getHours, getMinutes, isSameDay, isSameHour, isThisYear, isToday, setHours, subDays } from 'date-fns'
import { UseElementVisibility } from '@vueuse/components'

import type { TimeblockEventNode, TimeblockNode } from './types'
import { Pool } from './node'

const props = defineProps<{
  date: Date
  list: Array<TimeblockNode>
}>()

const { date: dateVModel } = useVModels(props)
const { locale } = useI18n()
const { formatHHmmss, format } = useDateFns()

const timeline = new Array(24).fill(0).map((_, i) => i)
const ratio = 1.5
const CELL_HEIGHT = 60

const calendar = ref<HTMLElement | null>(null)

const [switchDateVisible, toggleSwitchDateVisible] = useToggle()

const { y } = useScroll(calendar)

const weekdaysDate = computed(() => new Array(7).fill(0).map((_, i) => subDays(dateVModel.value, 6 - i)))
const weekdays = computed(() => weekdaysDate.value.map(i => i.getDay()))
const weekdaysName = computed(() => weekdays.value.map(i => dayFullMap[locale.value][i]))
const dataMap = computed(() => {
  const pool = new Pool()
  for (const node of props.list)
    pool.add(node)

  const eventNodeList = pool.calcLayout()
  const map = new Map<number, Array<TimeblockEventNode>>()
  for (const item of eventNodeList) {
    for (const date of weekdaysDate.value) {
      if (isSameDay(item.start, date)) {
        const dateNum = date.getDate()
        map.set(dateNum, [...map.get(dateNum) || [], item])
      }
    }
  }
  return map
})

function getBlockList(date: Date, hour: number) {
  return (dataMap.value.get(date.getDate()) || []).filter(i => isSameHour(i.start, setHours(date, hour)))
}

function calcMinutes(num: number) {
  return ~~(num / 1000 / 60)
}

function moveDate(offset: number) {
  dateVModel.value = addDays(dateVModel.value, offset)
}

onMounted(() => {
  const hour = getHours(Date.now())
  const offset = 16
  const top = CELL_HEIGHT * ratio * hour - offset
  if (top) {
    calendar.value?.scrollTo({
      top,
    })
  }
})
</script>

<template>
  <div ref="calendar" h-full overflow-y-auto>
    <div sticky top-0 uno-card :class="y > 0 ? 'z-2 shadow-lg' : ''">
      <div flex items-center py-1>
        <div text-6 font-bold>
          {{ format(dateVModel, isThisYear(dateVModel) ? 'MMMM' : 'yyyy/MM') }}
        </div>
        <div flex-1 />
        <div flex items-center space-x-2 mr-1>
          <v-btn icon size="x-small" @click="moveDate(-7)">
            <div i-mdi:chevron-left text-5 />
          </v-btn>
          <v-btn color="primary" @click="() => toggleSwitchDateVisible()">
            {{ isToday(dateVModel) ? $t('timeblock.today') : format(dateVModel, 'do') }}
          </v-btn>
          <v-btn icon size="x-small" @click="moveDate(7)">
            <div i-mdi:chevron-right text-5 />
          </v-btn>
        </div>
      </div>
      <div flex class="[&>*]:flex-1">
        <div />
        <div
          v-for="name, index in weekdaysName" :key="name" flex justify-center items-center space-x-2 flex-grow-2
          h-12
        >
          <div>{{ weekdaysDate[index].getDate() }}</div>
          <div>{{ name }}</div>
        </div>
      </div>
    </div>
    <div>
      <div v-for="hour in timeline" :key="hour" flex class="[&>*]:flex-1">
        <div text-center relative>
          <div absolute class="top-[-12px]">
            {{ `${complement(hour)}:00` }}
          </div>
        </div>
        <div
          v-for="currentDate in weekdaysDate" :key="currentDate.getDate()" flex-grow-2 class="border-[#d6dee1]"
          border-r border-t relative :style="{
            height: `${CELL_HEIGHT * ratio}px`,
          }"
        >
          <div
            v-for="{ start, end, canvasEnd, color, name, parallelCount, parallelLine } in getBlockList(currentDate, hour)"
            :key="start" absolute z-1 overflow-hidden :style="{
              width: `${100 / parallelCount}%`,
              height: `${calcMinutes(canvasEnd - start) * ratio}px`,
              top: `${getMinutes(start) * ratio}px`,
              left: `${(parallelLine - 1) / parallelCount * 100}%`,
              borderRadius: '3px',
            }"
          >
            <UseElementVisibility v-slot="{ isVisible }">
              <template v-if="isVisible">
                <div
                  class="w-[3px]" absolute left-0 top-0 bottom-0 z-0 :style="{
                    backgroundColor: color,
                  }"
                />
                <div
                  class="w-[calc(100%-3px)]" absolute right-0 top-0 bottom-0 z-0 :style="{
                    backgroundColor: color,
                    opacity: 0.2,
                  }"
                />
                <div
                  h-full relative z-1 class="text-[10px] leading-[12px] p-[1px] pt-[2px] ml-[3px]" :style="{
                    color,
                  }"
                >
                  <div :class="parallelCount == 1 ? 'flex' : ''">
                    <div :class="parallelCount == 1 ? 'max-w-[70%]' : 'max-w-full'" truncate font-bold>
                      {{ name }}
                    </div>
                    <div flex-1 />
                    <div v-if="parallelCount == 1 || calcMinutes(end - start) > ratio * 12">
                      {{ format(start, 'HH:mm') }}
                    </div>
                  </div>
                </div>
                <v-tooltip activator="parent">
                  <div flex>
                    <div>
                      {{ name }}
                    </div>
                    <div w-10 />
                    <div>{{ format(start, 'HH:mm') }}</div>
                  </div>
                  <div>
                    {{ formatHHmmss(end - start) }}
                  </div>
                </v-tooltip>
              </template>
            </UseElementVisibility>
          </div>
        </div>
      </div>
    </div>
  </div>
  <advanced-dialog v-model:visible="switchDateVisible" class="w-[500px]!">
    <v-confirm-edit
      v-model="dateVModel" @save="() => toggleSwitchDateVisible()"
      @cancel="() => toggleSwitchDateVisible()"
    >
      <template #default="{ model: proxyModel, actions }">
        <v-date-picker v-model="proxyModel.value" color="primary" class="w-full!">
          <template #actions>
            <component :is="actions" />
          </template>
        </v-date-picker>
      </template>
    </v-confirm-edit>
  </advanced-dialog>
</template>
