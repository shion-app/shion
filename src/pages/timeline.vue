<script setup lang="ts">
import { endOfDay, isBefore, startOfDay, subMinutes } from 'date-fns'
import { open } from '@tauri-apps/plugin-shell'
import type { ComponentExposed } from 'vue-component-type-helpers'

import type { SelectActivity, SelectHistory, SelectNote, SelectRemark } from '@/modules/database'
import { db } from '@/modules/database'
import type { TimeLineNode } from '@/interfaces'
import type { Filter } from '@/components/timeline/types'

import TimelineGraph from '@/components/timeline/graph/TimelineGraph.vue'
import TimelineFilter from '@/components/timeline/TimelineFilter.vue'
import { timelineProvide } from '@/components/timeline/inject'
import type { StepCounter } from '@/utils'
import type { ObsidianNote } from '@/hooks/useObsidian'

type computedTimeLineNode = TimeLineNode & { compressGroupId: string }
type TimelineGraphExposed = ComponentExposed<typeof TimelineGraph>
type TimelineFilterExposed = ComponentExposed<typeof TimelineFilter>

const configStore = useConfigStore()
const historyStore = useHistoryStore()

const { xs } = useTailwindBreakpoints()
const { format } = useDateFns()
const route = useRoute()
const { onRefresh } = usePageRefresh()
const { success } = useNotify()
const { getList: getObsidianNoteList } = useObsidian()

const { config } = storeToRefs(configStore)

const { pullActiveBrowsers } = historyStore

const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])
const historyList = ref<Array<SelectHistory>>([])
const remarkList = ref<Array<SelectRemark>>([])
const momentList = ref<Array<ObsidianNote>>([])
const date = ref(new Date())
const filterCategory = ref(route.query.category as Filter['category'])
const filterTargetId = ref<Filter['id']>(route.query.id ? Number(route.query.id) : undefined)
const timelineGraphRef = ref<TimelineGraphExposed>()
const timelineFilterRef = ref<TimelineFilterExposed>()

const [compressed, toggleCompressed] = useToggle(true)
const [searchVisible, toggleSearchVisible] = useToggle()
const [historyVisible, toggleHistoryVisible] = useToggle(true)

timelineProvide({
  handleSuccess,
})

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
                title: i.plan.name,
                color: i.plan.color,
                compressGroupId: `plan-${i.planId}`,
                type: 'note',
                raw: i,
              }))
            : filterCategory.value == 'label'
              ? noteList.value
                .filter(i => typeof filterTargetId.value == 'number' ? i.labelId == filterTargetId.value : true)
                .map<computedTimeLineNode>(i => ({
                  start: i.start,
                  end: i.end,
                  title: i.label.name,
                  color: i.label.color,
                  compressGroupId: `label-${i.labelId}`,
                  type: 'note',
                  raw: i,
                }))
              : []
        ),
        ...(
          filterCategory.value == 'monitor'
            ? [
                ...activityList.value
                  .filter(i => typeof filterTargetId.value == 'number' ? i.programId == filterTargetId.value : true)
                  .map<computedTimeLineNode>(i => ({
                    start: i.start,
                    end: i.end,
                    title: i.program.name,
                    color: i.program.color,
                    compressGroupId: `program-${i.programId}`,
                    type: 'activity',
                    raw: i,
                  })),
                ...remarkList.value
                  .filter(i => typeof filterTargetId.value == 'number' ? i.programId == filterTargetId.value : true)
                  .map<computedTimeLineNode>(i => ({
                    start: i.time,
                    end: i.time,
                    title: `${i.program.name}: ${i.title}`,
                    color: i.program.color,
                    compressGroupId: `remark-${i.programId}`,
                    type: 'remark',
                    raw: i,
                  })),
              ]
            : []
        ),
        ...(filterCategory.value == 'history'
          ? historyList.value
            .filter(i => typeof filterTargetId.value == 'number' ? i.domainId == filterTargetId.value : true)
            .map<computedTimeLineNode>(i => ({
              start: i.lastVisited,
              end: i.lastVisited,
              title: `${i.title} (🌐${new URL(i.url).hostname})`,
              color: i.domain.color,
              compressGroupId: `domain-${i.domainId}`,
              type: 'history',
              raw: i,
            }))
          : []
        ),
        ...(filterCategory.value == 'moment'
          ? momentList.value
            .filter(i => typeof filterTargetId.value == 'number' ? i.groupId == filterTargetId.value : true)
            .map<computedTimeLineNode>(i => ({
              start: i.created,
              end: i.created,
              title: i.name,
              color: i.color,
              compressGroupId: `moment-${i.groupId}`,
              type: 'moment',
              raw: i,
            }))
          : []
        ),
      ]
    : [
        ...noteList.value.map<computedTimeLineNode>(i => ({
          start: i.start,
          end: i.end,
          title: i.label.name,
          color: i.label.color,
          compressGroupId: `label-${i.labelId}`,
          type: 'note',
          raw: i,
        })),
        ...activityList.value.map<computedTimeLineNode>(i => ({
          start: i.start,
          end: i.end,
          title: i.program.name,
          color: i.program.color,
          compressGroupId: `program-${i.programId}`,
          type: 'activity',
          raw: i,
        })),
        ...(historyVisible.value
          ? historyList.value.map<computedTimeLineNode>(i => ({
            start: i.lastVisited,
            end: i.lastVisited,
            title: `${i.title} (🌐${new URL(i.url).hostname})`,
            color: i.domain.color,
            compressGroupId: `domain-${i.domainId}`,
            type: 'history',
            raw: i,
          }))
          : []),
        ...remarkList.value.map<computedTimeLineNode>(i => ({
          start: i.time,
          end: i.time,
          title: `${i.program.name}: ${i.title}`,
          color: i.program.color,
          compressGroupId: `remark-${i.programId}`,
          type: 'remark',
          raw: i,
        })),
        ...momentList.value.map<computedTimeLineNode>(i => ({
          start: i.created,
          end: i.created,
          title: i.name,
          color: i.color,
          compressGroupId: `moment-${i.groupId}`,
          type: 'moment',
          raw: i,
        })),
      ]
  // i.end == i.start history两者相同
  const data = list.filter(i => i.end == i.start || i.end - i.start > calcDuration(config.value.timelineMinMinute, 'minute')).sort((a, b) => a.start - b.start)
  return compressed.value ? compress(data) : data
})

async function refresh(pullHistory = true) {
  const start = startOfDay(date.value).getTime()
  const end = endOfDay(date.value).getTime()
  const [_noteList, _activityList, _remarkList, _historyList, _momentList] = await Promise.all([
    db.note.select({
      start,
      end,
    }),
    db.activity.select({
      start,
      end,
    }),
    db.remark.select({
      start,
      end,
    }),
    db.history.select({
      start,
      end,
    }),
    getObsidianNoteList(start, end),
  ])
  const counter = randomStep([
    ..._noteList.flatMap(i => [i.start, i.end]),
    ..._activityList.flatMap(i => [i.start, i.end]),
    ..._historyList.map(i => i.lastVisited),
    ..._remarkList.map(i => i.time),
    ..._momentList.map(i => i.created),
  ])
  noteList.value = deduplicateTimeRange(_noteList, counter)
  activityList.value = deduplicateTimeRange(_activityList, counter)
  historyList.value = deduplicateHistory(_historyList, counter)
  remarkList.value = deduplicateRemark(_remarkList, counter)
  momentList.value = deduplicateMoment(_momentList, counter)

  if (pullHistory) {
    const count = await pullActiveBrowsers()
    if (count)
      await refresh(false)
  }
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
      title: first.title,
      color: first.color,
      start: min,
      end: max,
      children: list.length == 1
        ? []
        : list.map(i => ({
          start: i.start,
          end: i.end,
          color: i.color,
        })),
      type: first.type,
      raw: first.raw,
    }
  })
}

/**
 * history 浏览器源数据存在访问时间相同的项
 */
function deduplicateHistory(list: Array<SelectHistory>, counter: StepCounter) {
  return list.map(item => ({
    ...item,
    lastVisited: counter.get(item.lastVisited),
  }))
}

function deduplicateRemark(list: Array<SelectRemark>, counter: StepCounter) {
  return list.map(item => ({
    ...item,
    time: counter.get(item.time),
  }))
}

function deduplicateMoment(list: Array<ObsidianNote>, counter: StepCounter) {
  return list.map(item => ({
    ...item,
    created: counter.get(item.created),
  }))
}

function deduplicateTimeRange<T extends {
  start: number
  end: number
}>(list: Array<T>, counter: StepCounter) {
  return list.map(item => ({
    ...item,
    start: counter.get(item.start),
    end: counter.get(item.end),
  }))
}

async function handleSearch(keyword: string, page: number, size: number) {
  const { list, count } = (await db.history.paginationSelect({
    keyword,
    page,
    size,
  }))
  const counter = randomStep(list.map(i => i.lastVisited))
  return {
    list: deduplicateHistory(list, counter).map(i => ({
      time: i.lastVisited,
      content: i.title,
      navigate: () => open(i.url),
    })),
    count,
  }
}

watch(date, () => refresh(), {
  immediate: true,
})

onRefresh(refresh)
</script>

<template>
  <div h-full flex>
    <div flex-1>
      <TimelineGraph v-if="list.length" ref="timelineGraphRef" :list="list" flex-1 />
      <empty v-else type="timeline" :desc="$t('hint.timeline')" />
    </div>
    <calendar :id="filterTargetId" v-model:date="date" :category="filterCategory" />
  </div>
  <TimelineFilter ref="timelineFilterRef" v-model:category="filterCategory" v-model:id="filterTargetId" />
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
      v-if="!filterCategory"
      :tooltip="historyVisible ? $t('statusBar.timeline.historyVisible.tooltip.hide') : $t('statusBar.timeline.historyVisible.tooltip.show')"
      :text="$t('statusBar.timeline.historyVisible.text')" :icon="historyVisible ? 'i-mdi:eye' : 'i-mdi:eye-off'"
      @click="() => {
        toggleHistoryVisible()
        timelineGraphRef?.scrollToViewportTime()
      }"
    />
    <status-bar-button
      :tooltip="compressed ? $t('statusBar.timeline.node.tooltip.decompress') : $t('statusBar.timeline.node.tooltip.compress')"
      :text="$t('statusBar.timeline.node.text')"
      :icon="compressed ? 'i-mdi:arrow-split-vertical' : 'i-mdi:arrow-collapse-horizontal'" @click="() => {
        toggleCompressed()
        timelineGraphRef?.scrollToViewportTime()
      }"
    />
    <status-bar-button
      :tooltip="$t('statusBar.timeline.search.tooltip')" :text="$t('statusBar.timeline.search.text')"
      icon="i-mdi:magnify" @click="() => toggleSearchVisible()"
    />
  </status-bar-teleport>
  <search v-model:visible="searchVisible" :search="handleSearch" />
  <more-menu>
    <v-list>
      <v-list-item
        value="timeline.filter" :title="$t('timeline.filter')" append-icon="mdi-filter-outline"
        @click="timelineFilterRef?.openFilterForm"
      />
    </v-list>
  </more-menu>
</template>
