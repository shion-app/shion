<script setup lang="ts">
import SVG from 'svg.js'

import type { TimeLineNode } from '@/interfaces'

interface GraphItem {
  name: string
  color: string
  start: PointWithTime
  end: PointWithTime
  children: number
  totalTime: number
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

const { t } = useI18n()
const { format, formatHHmmss } = useDateFns()

const pointDistance = 80
const pointSize = 40
const pointOffset = pointSize / 4
const pointRadius = pointSize / 2
const offsetLeft = 100
const textOffsetLeft = 100
const lineWidth = 10
const secondaryLineOffset = textOffsetLeft - lineWidth * 2

const svg = ref()

const timeline = computed(() => props.list.flatMap(i => [i.start, i.end]).sort())

const graph = computed(() => {
  const primary: Array<GraphItem> = []
  const secondary: Array<GraphItem> = []
  for (const item of props.list) {
    // fix: 前节点end和后节点start相同（暂时处理）
    const startIndex = timeline.value.lastIndexOf(item.start)
    const endIndex = timeline.value.indexOf(item.end)
    const isSibling = endIndex - startIndex == 1
    const graphItem: GraphItem = {
      name: item.name,
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
      children: item.children?.length || 0,
      totalTime: (item.children || []).reduce((acc, prev) => acc += prev.end - prev.start, 0),
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

function draw() {
  const pointCount = props.list.length * 2
  const height = (pointCount - 1) * pointDistance + pointSize
  svg.value = svg.value!.size('100%', `${height}px`)
  drawPrimaryPath(svg.value)
  drawSecondaryPath(svg.value)
}

function drawPrimaryPath(svg: SVG.Doc) {
  const pointCount = props.list.length * 2
  const height = (pointCount - 1) * pointDistance + pointSize
  svg.line(0, pointRadius, 0, height - pointRadius).stroke({ width: lineWidth }).opacity(0.6).translate(offsetLeft, 0)

  for (const item of graph.value.primary) {
    svg.line(item.start.x, item.start.y, item.end.x, item.end.y).stroke({ width: lineWidth, color: item.color }).translate(offsetLeft, 0)
    drawPoint(svg, item)
  }
}

function createSecondaryPath(start: Point, end: Point) {
  const distance = (end.y - start.y) / 2
  const xDistance = secondaryLineOffset
  const yDistance = distance / 2
  const controlYDistance = distance / 4
  const startControlPoint1: Point = {
    x: start.x,
    y: start.y + controlYDistance,
  }
  const midPoint1: Point = {
    x: start.x + xDistance,
    y: start.y + yDistance,
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
  let path = `M ${start.x} ${start.y} `
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
    drawPoint(svg, item)
  }
}

function drawPoint(svg: SVG.Doc, item: GraphItem) {
  const startPointTranslateX = offsetLeft + item.start.x - pointOffset
  const startPointTranslateY = item.start.y - pointOffset
  const endPointTranslateX = offsetLeft + item.end.x - pointOffset
  const endPointTranslateY = item.end.y - pointOffset
  svg.text(format(item.start.time, 'HH:mm:ss')).translate(0, startPointTranslateY)
  svg.circle(pointRadius).fill(item.color).translate(startPointTranslateX, startPointTranslateY)
  svg.text(item.name).fill(item.color).translate(startPointTranslateX + textOffsetLeft, startPointTranslateY)
  if (item.children) {
    svg.text(t('timelineGraph.include', {
      count: item.children,
      totalTime: formatHHmmss(item.totalTime),
    })).fill(item.color).translate(startPointTranslateX + textOffsetLeft, startPointTranslateY + 30)
  }
  svg.circle(pointRadius).fill(item.color).translate(endPointTranslateX, endPointTranslateY)
  svg.text(format(item.end.time, 'HH:mm:ss')).translate(0, endPointTranslateY)
}

onMounted(() => {
  svg.value = SVG('timeline')
  draw()
})

watchDeep(() => props.list, () => {
  svg.value?.clear()
  draw()
})
</script>

<template>
  <div id="timeline" h-full overflow-y-auto p-4 />
</template>
