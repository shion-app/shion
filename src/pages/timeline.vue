<script setup lang="ts">
import { endOfDay, startOfDay } from 'date-fns'

import type { SelectActivity, SelectLabel, SelectNote, SelectPlan, SelectProgram } from '@/modules/database'
import { db } from '@/modules/database'
import type { TimeLineNode } from '@/interfaces'

type computedTimeLineNode = TimeLineNode & { id: string }

const configStore = useConfigStore()
const { t } = useI18n()

const { config } = storeToRefs(configStore)

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])
const planList = ref<Array<SelectPlan>>([])
const labelList = ref<Array<SelectLabel>>([])
const programList = ref<Array<SelectProgram>>([])
const date = ref(new Date())
const filterCategory = ref<'plan' | 'label' | 'monitor' | string & {}>('')
const filterTargetId = ref<number>()

const list = computed(() => {
  const list = filterCategory.value
    ? [
        ...(
          filterCategory.value == 'plan'
            ? noteList.value
              .filter(i => typeof filterTargetId.value == 'number' ? i.planId == filterTargetId.value : true)
              .map(i => ({
                start: i.start,
                end: i.end,
                name: i.plan.name,
                color: i.plan.color,
                id: `plan-${i.planId}`,
              }))
            : filterCategory.value == 'label'
              ? noteList.value
                .filter(i => typeof filterTargetId.value == 'number' ? i.labelId == filterTargetId.value : true)
                .map(i => ({
                  start: i.start,
                  end: i.end,
                  name: i.label.name,
                  color: i.label.color,
                  id: `label-${i.labelId}`,
                }))
              : []
        ),
        ...(
          filterCategory.value == 'monitor'
            ? activityList.value
              .filter(i => typeof filterTargetId.value == 'number' ? i.programId == filterTargetId.value : true)
              .map(i => ({
                start: i.start,
                end: i.end,
                name: i.program.name,
                color: i.program.color,
                id: `program-${i.programId}`,
              }))
            : []
        ),
      ]
    : [
        ...noteList.value.map(i => ({
          start: i.start,
          end: i.end,
          name: i.label.name,
          color: i.label.color,
          id: `label-${i.labelId}`,
        })),
        ...activityList.value.map(i => ({
          start: i.start,
          end: i.end,
          name: i.program.name,
          color: i.program.color,
          id: `program-${i.programId}`,
        })),
      ]
  return compress(list.filter(i => i.end - i.start > config.value.timelineMinMinute * 1000 * 60).sort((a, b) => a.start - b.start))
})

const filterOptions = computed(() => [
  {
    title: t('timeline.plan'),
    value: 'plan',
  },
  {
    title: t('timeline.label'),
    value: 'label',
  },
  {
    title: t('timeline.monitor'),
    value: 'monitor',
  },
])

const filterTargetOptions = computed(() => {
  switch (filterCategory.value) {
    case 'plan':
      return planList.value.map(i => ({
        title: i.name,
        value: i.id,
      }))
    case 'label':
      return labelList.value.map(i => ({
        title: i.name,
        value: i.id,
      }))
    case 'monitor':
      return programList.value.map(i => ({
        title: i.name,
        value: i.id,
      }))

    default:
      return []
  }
})

async function refresh() {
  const start = startOfDay(date.value).getTime()
  const end = endOfDay(date.value).getTime()
  ;[noteList.value, activityList.value, planList.value, labelList.value, programList.value] = await Promise.all([
    db.note.select({
      start,
      end,
    }),
    db.activity.select({
      start,
      end,
    }),
    db.plan.select(),
    db.label.select(),
    db.program.select(),
  ])
}

function resetFilterCondition() {
  filterCategory.value = ''
  filterTargetId.value = undefined
}

function compress(list: Array<computedTimeLineNode>): Array<TimeLineNode> {
  const temp: Array<Array<computedTimeLineNode>> = []
  for (let i = 0; i < list.length; i++) {
    let index = i
    const group: Array<computedTimeLineNode> = []
    while (list[index]?.id == list[i].id) {
      group.push(list[index])
      index++
    }
    temp.push(group)
    i = index - 1
  }
  return temp.map((list) => {
    const [first] = list
    const min = Math.min(...list.map(i => i.start))
    const max = Math.max(...list.map(i => i.end))
    return {
      name: first.name,
      color: first.color,
      start: min,
      end: max,
      children: list.length == 1
        ? []
        : list.map(i => ({
          start: i.start,
          end: i.end,
          name: i.name,
          color: i.color,
        })),
    }
  })
}

watch(date, refresh, {
  immediate: true,
})

watch(filterCategory, () => filterTargetId.value = undefined)
</script>

<template>
  <div h-full flex>
    <div flex-1 flex flex-col>
      <div flex space-x-4 mb-4>
        <v-select
          v-model="filterCategory"
          :items="filterOptions"
          :label="$t('timeline.filter')"
          hide-details
          class="w-[200px] flex-none!"
        />
        <v-select
          v-if="filterCategory"
          v-model="filterTargetId"
          :items="filterTargetOptions"
          :label="$t(`timeline.${filterCategory}`)"
          hide-details
          class="w-[200px] flex-none!"
        />
        <v-tooltip v-if="filterCategory" :text="$t('timeline.reset')" location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-refresh" v-bind="props" @click="resetFilterCondition" />
          </template>
        </v-tooltip>
      </div>
      <timeline-graph v-if="list.length" :list="list" flex-1 />
      <empty v-else />
    </div>
    <calendar v-model:date="date" />
  </div>
</template>
