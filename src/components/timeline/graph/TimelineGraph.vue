<script setup lang="ts">
import SVG from 'svg.js'

import type { TimeLineNode, TimeLineNodeGraphData } from '@/interfaces'
import type { SelectActivity, SelectHistory, SelectNote, SelectRemark } from '@/modules/database'
import type { ObsidianNote } from '@/hooks/useObsidian'

interface GraphItem extends TimeLineNodeGraphData {
  color: string
  start: PointWithTime
  end: PointWithTime
}

interface Point {
  x: number
  y: number
}

interface PointWithTime extends Point {
  time: number
}

const props = defineProps<{
  list: Array<TimeLineNode>
}>()

defineExpose({
  scrollToViewportTime,
  scrollTo,
})

const { format } = useDateFns()

const listRef = ref<HTMLElement | null>(null)

const pointDistance = 70
const pointSize = 50
const pointOffset = pointSize / 4
const pointRadius = pointSize / 2
const offsetLeft = 100
const textOffsetLeft = 70
const lineWidth = 10
const secondaryLineOffset = textOffsetLeft - lineWidth * 2
const outerOffset = 4

const graphItemAttrs = {
  style: {
    top: `${outerOffset * 2}px`,
    left: `${offsetLeft + (pointOffset + outerOffset) / 2}px`,
  },
  class: 'w-[16px] h-[16px] absolute pointer-events-auto',
}

const primary = ref<SVG.Doc>()
const secondary = ref<SVG.Doc>()
const graphItemRef = useTemplateRefsList<HTMLElement>()

const timeline = computed(() => props.list.flatMap((i) => {
  if (i.start == i.end)
    return [i.start]

  return [i.start, i.end]
}).sort())

const graph = computed(() => {
  const primary: Array<GraphItem> = []
  const secondary: Array<GraphItem> = []
  for (const item of props.list) {
    const startIndex = timeline.value.indexOf(item.start)
    const endIndex = timeline.value.indexOf(item.end)
    // history start和end相同 endIndex - startIndex == 0
    // 其他相邻数据 endIndex - startIndex == 1
    const isSibling = endIndex - startIndex <= 1
    const graphItem: GraphItem = {
      color: item.color,
      start: {
        x: 0,
        y: startIndex * pointDistance + pointRadius,
        time: item.start,
      },
      end: {
        x: 0,
        y: endIndex * pointDistance + pointRadius,
        time: item.end,
      },
      common: {
        title: item.title,
        children: item.children?.length || 0,
        totalTime: (item.children || []).reduce((acc, prev) => acc += prev.end - prev.start, 0),
      },
      type: item.type,
      raw: item.raw,
    }
    if (isSibling)
      primary.push(graphItem)

    else
      secondary.push(graphItem)
  }

  return {
    primary,
    secondary,
  }
})

const nodeList = computed(() => {
  const { primary, secondary } = graph.value
  return [...primary, ...secondary]
})

function draw() {
  const pointCount = timeline.value.length
  const height = (pointCount - 1) * pointDistance + pointSize
  primary.value = primary.value!.size('100%', `${height}px`)
  secondary.value = secondary.value!.size('100%', `${height}px`)
  drawPrimaryPath(height, primary.value)
  drawSecondaryPath(secondary.value)
}

function drawPrimaryPath(height: number, svg: SVG.Doc) {
  svg.line(0, pointRadius, 0, height - pointRadius).stroke({ width: lineWidth }).opacity(0.6).translate(offsetLeft, 0)

  for (const item of graph.value.primary) {
    svg.line(item.start.x, item.start.y, item.end.x, item.end.y).stroke({ width: lineWidth, color: item.color }).translate(offsetLeft, 0)
    drawPoint(svg, item)
  }
  for (const item of graph.value.secondary)
    drawPoint(svg, item)
}

function createSecondaryPath(start: Point, end: Point) {
  // startX 和 startY 用于偏移起始点
  const startY = start.y + pointOffset
  const startX = start.x
  const distance = (end.y - startY) / 2
  const xDistance = secondaryLineOffset
  const yDistance = distance / 2
  const controlYDistance = distance / 4
  const startControlPoint1: Point = {
    x: startX,
    y: startY + controlYDistance,
  }
  const midPoint1: Point = {
    x: startX + xDistance,
    y: startY + yDistance,
  }
  const startControlPoint2: Point = {
    x: midPoint1.x,
    y: midPoint1.y - controlYDistance,
  }

  const midPoint2: Point = {
    x: end.x + xDistance,
    y: end.y - yDistance,
  }
  const endControlPoint1: Point = {
    x: midPoint2.x,
    y: midPoint2.y + controlYDistance,
  }
  const endControlPoint2: Point = {
    x: end.x,
    y: end.y - controlYDistance,
  }
  let path = `M ${startX} ${startY} `
  path += `C ${startControlPoint1.x} ${startControlPoint1.y} ${startControlPoint2.x} ${startControlPoint2.y} ${midPoint1.x} ${midPoint1.y} `
  path += `L ${midPoint2.x} ${midPoint2.y} `
  path += `C ${endControlPoint1.x} ${endControlPoint1.y} ${endControlPoint2.x} ${endControlPoint2.y} ${end.x} ${end.y} `
  return path
}

function drawSecondaryPath(svg: SVG.Doc) {
  for (const item of graph.value.secondary) {
    svg.path(createSecondaryPath(item.start, item.end))
      .fill('transparent')
      .stroke({
        color: item.color,
        width: lineWidth,
      })
      .translate(offsetLeft, 0)
  }
}

function drawPoint(svg: SVG.Doc, item: GraphItem) {
  const startPointTranslateX = offsetLeft + item.start.x - pointOffset
  const startPointTranslateY = item.start.y - pointOffset
  const endPointTranslateX = offsetLeft + item.end.x - pointOffset
  const endPointTranslateY = item.end.y - pointOffset
  const textYOffset = pointOffset / 2
  const outerPointRadius = pointRadius + outerOffset * 2
  svg.text(format(item.start.time, 'HH:mm:ss')).translate(0, startPointTranslateY - textYOffset)
  svg.circle(outerPointRadius).fill(item.color).translate(startPointTranslateX - outerOffset, startPointTranslateY - outerOffset)
  svg.circle(pointRadius).fill('#ffffff').translate(startPointTranslateX, startPointTranslateY)
  if (item.start.time != item.end.time) {
    svg.text(format(item.end.time, 'HH:mm:ss')).translate(0, endPointTranslateY - textYOffset)
    svg.circle(pointRadius).fill(item.color).translate(endPointTranslateX, endPointTranslateY)
  }
}

async function scrollToViewportTime() {
  let viewportTime = new Date().getTime()
  let firstElementTop = Infinity
  for (const item of graphItemRef.value) {
    const { top } = item.getBoundingClientRect()
    const time = Number(item.dataset.start)
    if (top > 0 && top < firstElementTop) {
      firstElementTop = top
      viewportTime = time
    }
  }

  await sleep(200)

  scrollTo(viewportTime)
}

function scrollTo(time: number, block: ScrollLogicalPosition = 'start') {
  let closest = Infinity
  let closestItem: HTMLElement | undefined
  for (const item of graphItemRef.value) {
    const start = Number(item.dataset.start)
    const current = Math.abs(time - start)
    if (current < closest) {
      closest = current
      closestItem = item
    }
  }
  closestItem?.scrollIntoView({
    block,
  })
}

onMounted(() => {
  primary.value = SVG('timeline-primary')
  secondary.value = SVG('timeline-secondary')
  draw()
  if (listRef.value)
    listRef.value.scrollTop = listRef.value.scrollHeight
})

watchDeep(() => props.list, () => {
  primary.value?.clear()
  secondary.value?.clear()
  draw()
})

function isActivity(type: string, raw: unknown): raw is SelectActivity {
  return type == 'activity'
}
function isNote(type: string, raw: unknown): raw is SelectNote {
  return type == 'note'
}

function isHistory(type: string, raw: unknown): raw is SelectHistory {
  return type == 'history'
}

function isRemark(type: string, raw: unknown): raw is SelectRemark {
  return type == 'remark'
}

function isMoment(type: string, raw: unknown): raw is ObsidianNote {
  return type == 'moment'
}
</script>

<template>
  <div ref="listRef" relative h-full overflow-y-auto>
    <div id="timeline-primary" p-4 absolute top-0 left-0 right-0 />
    <div pointer-events-none>
      <div
        v-for="{ start, end, common, type, raw } in nodeList" :key="start.y" :ref="graphItemRef.set" absolute w-full
        :style="{
          top: `${start.y}px`,
          left: `${start.x}px`,
          height: `${end.y - start.y + pointOffset * 3}px`,
        }" :data-start="start.time"
      >
        <div
          absolute inset-0 pr-2 :style="{
            paddingLeft: `${offsetLeft + pointOffset + textOffsetLeft}px`,
          }"
        >
          <timeline-activity v-if="isActivity(type, raw)" v-bind="graphItemAttrs" :data="common" :raw="raw" />
          <timeline-note v-else-if="isNote(type, raw)" v-bind="graphItemAttrs" :data="common" :raw="raw" />
          <timeline-history v-else-if="isHistory(type, raw)" v-bind="graphItemAttrs" :data="common" :raw="raw" />
          <timeline-remark v-else-if="isRemark(type, raw)" v-bind="graphItemAttrs" :data="common" :raw="raw" />
          <timeline-moment v-else-if="isMoment(type, raw)" v-bind="graphItemAttrs" :data="common" :raw="raw" />
        </div>
      </div>
    </div>
    <div id="timeline-secondary" p-4 absolute top-0 left-0 right-0 pointer-events-none />
  </div>
</template>
