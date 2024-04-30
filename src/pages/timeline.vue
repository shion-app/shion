<script setup lang="ts">
import { endOfDay, isBefore, startOfDay, subMinutes } from 'date-fns'

import type { SelectActivity, SelectHistory, SelectNote } from '@/modules/database'
import { db } from '@/modules/database'
import type { TimeLineNode } from '@/interfaces'
import type { Filter } from '@/components/timeline/types'

type computedTimeLineNode = TimeLineNode & { compressGroupId: string }

const configStore = useConfigStore()

const { xs, sm } = useTailwindBreakpoints()
const { format } = useDateFns()
const route = useRoute()
const { onRefresh } = usePageRefresh()
const { success } = useNotify()
const historyStore = useHistoryStore()

const { config } = storeToRefs(configStore)
const { requesting, progress } = storeToRefs(historyStore)

const { pullActiveBrowsers } = historyStore

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])
const historyList = ref<Array<SelectHistory>>([])
const date = ref(new Date())
const [compressed, toggleCompressed] = useToggle(true)

const filterCategory = ref(route.query.category as Filter['category'])
const filterTargetId = ref<Filter['id']>(route.query.id ? Number(route.query.id) : undefined)

async function handleSuccess() {
  success({})
  await refresh()
}

const list = computed(() => {
  const list = filterCategory.value
    ? [
        ...(
          filterCategory.value == 'plan'
            ? noteList.value
              .filter(i => typeof filterTargetId.value == 'number' ? i.planId == filterTargetId.value : true)
              .map<computedTimeLineNode>(i => ({
                start: i.start,
                end: i.end,
                name: i.plan.name,
                color: i.plan.color,
                compressGroupId: `plan-${i.planId}`,
                remove: async () => {
                  await db.note.remove(i.id)
                  await handleSuccess()
                },
                update: async (data) => {
                  await db.note.update(i.id, data)
                  await handleSuccess()
                },
              }))
            : filterCategory.value == 'label'
              ? noteList.value
                .filter(i => typeof filterTargetId.value == 'number' ? i.labelId == filterTargetId.value : true)
                .map<computedTimeLineNode>(i => ({
                  start: i.start,
                  end: i.end,
                  name: i.label.name,
                  color: i.label.color,
                  compressGroupId: `label-${i.labelId}`,
                  remove: async () => {
                    await db.note.remove(i.id)
                    await handleSuccess()
                  },
                  update: async (data) => {
                    await db.note.update(i.id, data)
                    await handleSuccess()
                  },
                }))
              : []
        ),
        ...(
          filterCategory.value == 'monitor'
            ? activityList.value
              .filter(i => typeof filterTargetId.value == 'number' ? i.programId == filterTargetId.value : true)
              .map<computedTimeLineNode>(i => ({
                start: i.start,
                end: i.end,
                name: i.program.name,
                color: i.program.color,
                compressGroupId: `program-${i.programId}`,
              }))
            : []
        ),
        ...(filterCategory.value == 'history'
          ? historyList.value
            .filter(i => typeof filterTargetId.value == 'number' ? i.domainId == filterTargetId.value : true)
            .map<computedTimeLineNode>(i => ({
              start: i.lastVisited,
              end: i.lastVisited,
              name: `${i.title} (🌐${new URL(i.url).hostname})`,
              color: i.domain.color,
              compressGroupId: `domain-${i.domainId}`,
              url: i.url,
            }))
          : []
        ),
      ]
    : [
        ...noteList.value.map<computedTimeLineNode>(i => ({
          start: i.start,
          end: i.end,
          name: i.label.name,
          color: i.label.color,
          compressGroupId: `label-${i.labelId}`,
          remove: async () => {
            await db.note.remove(i.id)
            await handleSuccess()
          },
          update: async (data) => {
            await db.note.update(i.id, data)
            await handleSuccess()
          },
        })),
        ...activityList.value.map<computedTimeLineNode>(i => ({
          start: i.start,
          end: i.end,
          name: i.program.name,
          color: i.program.color,
          compressGroupId: `program-${i.programId}`,
        })),
        ...historyList.value.map<computedTimeLineNode>(i => ({
          start: i.lastVisited,
          end: i.lastVisited,
          name: `${i.title} (🌐${new URL(i.url).hostname})`,
          color: i.domain.color,
          compressGroupId: `domain-${i.domainId}`,
          url: i.url,
        })),
      ]
  // i.end == i.start history两者相同
  const data = list.filter(i => i.end == i.start || i.end - i.start > config.value.timelineMinMinute * 1000 * 60).sort((a, b) => a.start - b.start)
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
  await pullActiveBrowsers()
  historyList.value = deduplicate(await db.history.select({
    start,
    end,
  }))
}

function compress(list: Array<computedTimeLineNode>): Array<TimeLineNode> {
  const temp: Array<Array<computedTimeLineNode>> = []
  for (let i = 0; i < list.length; i++) {
    let groupItemindex = i
    const group: Array<computedTimeLineNode> = []
    // 相同类别相距30分钟以内，合为一组
    while (list[groupItemindex]?.compressGroupId == list[i].compressGroupId && (groupItemindex == i || isBefore(subMinutes(list[groupItemindex].start, config.value.timelineGroupGapMinute), list[groupItemindex - 1].end))) {
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
      url: first.url,
    }
  })
}

/**
 * history 浏览器源数据存在访问时间相同的项
 */
function deduplicate(list: Array<SelectHistory>) {
  const set = new Set()
  const result: Array<SelectHistory> = []
  for (const item of list) {
    if (!set.has(item.lastVisited)) {
      result.push(item)
      set.add(item.lastVisited)
    }
  }
  return result
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
    <status-bar-button
      :tooltip="compressed ? $t('statusBar.timeline.node.tooltip.decompress') : $t('statusBar.timeline.node.tooltip.compress')"
      :text="$t('statusBar.timeline.node.text')"
      :icon="compressed ? 'i-mdi:arrow-split-vertical' : 'i-mdi:arrow-collapse-horizontal'"
      @click="() => toggleCompressed()"
    />

    <status-bar-button
      v-if="requesting && progress > 0" :tooltip="$t('statusBar.timeline.history.tooltip')"
      class="-order-1"
    >
      <div flex items-center space-x-1>
        <div>{{ $t('statusBar.timeline.history.text') }}</div>
        <div class="w-[60px]">
          <v-progress-linear color="primary" :model-value="progress" rounded height="8" />
        </div>
      </div>
    </status-bar-button>
  </status-bar-teleport>
</template>
