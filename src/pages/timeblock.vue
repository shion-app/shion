<script setup lang="ts">
import { isBefore, subMinutes } from 'date-fns'

import { db } from '@/modules/database'
import type { SelectActivity, SelectNote } from '@/modules/database'
import type { TimeblockNode } from '@/components/timeblock/types'
import type { StepCounter } from '@/utils'

type computedTimeBlockNode = TimeblockNode & { compressGroupId: string }

const configStore = useConfigStore()

const { config } = storeToRefs(configStore)
const { onRefresh, refresh } = usePageRefresh()

const date = ref(new Date())
const noteList = ref<Array<SelectNote>>([])
const activityList = ref<Array<SelectActivity>>([])

const range = computed(() => generateRange(7, date.value))

const list = computed(() => {
  const data = [
    ...noteList.value.map(i => ({
      start: i.start,
      end: i.end,
      canvasEnd: i.end,
      name: i.label.name,
      color: i.label.color,
      compressGroupId: `label-${i.labelId}`,
    })),
    ...activityList.value.map(i => ({
      start: i.start,
      end: i.end,
      canvasEnd: i.end,
      name: i.program.name,
      color: i.program.color,
      compressGroupId: `program-${i.programId}`,
    })),
  ].filter(i => i.end - i.start > calcDuration(config.value.timeblockMinMinute, 'minute')).sort((a, b) => a.start - b.start)
  // fix: 合并->切割->补满->排序
  return splitByDay(compress(data), range.value).map(i => ({
    ...i,
    canvasEnd: i.end - i.start > calcDuration(10, 'minute') ? i.end : i.start + calcDuration(10, 'minute'),
  })).sort((a, b) => a.start - b.start)
})

async function handleRefresh() {
  const [start, end] = range.value.map(date => date.getTime())
  const [_noteList, _activityList] = await Promise.all([db.note.select({
    start,
    end,
  }), db.activity.select({
    start,
    end,
  }),
  ])
  const counter = randomStep([
    ..._noteList.flatMap(i => [i.start, i.end]),
    ..._activityList.flatMap(i => [i.start, i.end]),
  ])
  noteList.value = deduplicateTimeRange(_noteList, counter)
  activityList.value = deduplicateTimeRange(_activityList, counter)

  const newCounter = randomStep([
    ..._noteList.flatMap(i => [i.start, i.end]),
    ..._activityList.flatMap(i => [i.start, i.end]),
  ])
  noteList.value = deduplicateTimeRange(_noteList, newCounter)
  activityList.value = deduplicateTimeRange(_activityList, newCounter)
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

function compress(list: Array<computedTimeBlockNode>): Array<TimeblockNode> {
  const temp: Array<Array<computedTimeBlockNode>> = []
  for (let i = 0; i < list.length; i++) {
    let groupItemindex = i
    const group: Array<computedTimeBlockNode> = []
    // 相同类别相距1分钟以内，合为一组
    while (list[groupItemindex]?.compressGroupId == list[i].compressGroupId && (groupItemindex == i || isBefore(subMinutes(list[groupItemindex].start, 1), list[groupItemindex - 1].end))) {
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
    const canvasMax = Math.max(...list.map(i => i.canvasEnd))
    return {
      name: first.name,
      color: first.color,
      start: min,
      end: max,
      canvasEnd: canvasMax,
    }
  })
}

onRefresh(handleRefresh)

watchImmediate(date, refresh)
</script>

<template>
  <timeblock-week v-model:date="date" :list="list" />
</template>
