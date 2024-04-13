<script setup lang="ts">
import { endOfDay, isBefore, startOfDay, subMinutes } from 'date-fns'

import type { SelectActivity, SelectNote } from '@/modules/database'
import { db } from '@/modules/database'
import type { TimeLineNode } from '@/interfaces'
import type { Filter } from '@/components/timeline/types'

type computedTimeLineNode = TimeLineNode & { id: string }

const configStore = useConfigStore()

const { xs, sm } = useTailwindBreakpoints()
const { format } = useDateFns()
const route = useRoute()
const { onRefresh } = usePageRefresh()

const { config } = storeToRefs(configStore)

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])
const date = ref(new Date())
const [compressed, toggleCompressed] = useToggle(true)

const filterCategory = ref(route.query.category as Filter['category'])
const filterTargetId = ref<Filter['id']>(route.query.id ? Number(route.query.id) : undefined)

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
  const data = list.filter(i => i.end - i.start > config.value.timelineMinMinute * 1000 * 60).sort((a, b) => a.start - b.start)
  return compressed.value ? compress(data) : data
})

async function refresh() {
  const start = startOfDay(date.value).getTime()
  const end = endOfDay(date.value).getTime()
  ;[noteList.value, activityList.value] = await Promise.all([
    db.note.select({
      start,
      end,
    }),
    db.activity.select({
      start,
      end,
    }),
  ])
}

function compress(list: Array<computedTimeLineNode>): Array<TimeLineNode> {
  const temp: Array<Array<computedTimeLineNode>> = []
  for (let i = 0; i < list.length; i++) {
    let groupItemindex = i
    const group: Array<computedTimeLineNode> = []
    // 相同类别相距30分钟以内，合为一组
    while (list[groupItemindex]?.id == list[i].id && (groupItemindex == i || isBefore(subMinutes(list[groupItemindex].start, config.value.timelineGroupGapMinute), list[groupItemindex - 1].end))) {
      group.push(list[groupItemindex])
      groupItemindex++
    }
    temp.push(group)
    i = groupItemindex - 1
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

onRefresh(refresh)
</script>

<template>
  <div h-full flex>
    <div flex-1>
      <timeline-graph v-if="list.length" :list="list" flex-1 />
      <empty v-else type="timeline" :desc="$t('hint.timeline')" />
    </div>
    <calendar v-if="sm" :id="filterTargetId" v-model:date="date" :category="filterCategory" />
  </div>
  <timeline-filter v-model:category="filterCategory" v-model:id="filterTargetId" />
  <status-bar-teleport>
    <status-bar-content :title="$t('nav.timeline')">
      <template #append>
        <v-btn v-if="xs" variant="text">
          {{ format(date, 'PP') }}
          <v-dialog activator="parent">
            <v-date-picker v-model="date" show-adjacent-months class="w-full!" />
          </v-dialog>
        </v-btn>
      </template>
    </status-bar-content>
  </status-bar-teleport>
  <status-bar-teleport :xs="false">
    <v-tooltip :text="compressed ? $t('statusBar.decompress') : $t('statusBar.compress')" location="top">
      <template #activator="{ props }">
        <v-btn v-bind="props" variant="text" @click="() => toggleCompressed()">
          <div :class="compressed ? 'i-mdi:arrow-split-vertical' : 'i-mdi:arrow-collapse-horizontal'" text-6 />
        </v-btn>
      </template>
    </v-tooltip>
  </status-bar-teleport>
</template>
