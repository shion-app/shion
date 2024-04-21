<script setup lang="ts">
import SVG from 'svg.js'
import classNames from 'classnames'

import type { TimeLineNode } from '@/interfaces'

interface GraphItem {
  name: string
  color: string
  start: PointWithTime
  end: PointWithTime
  children: number
  totalTime: number
  actions: {
    remove: TimeLineNode['remove']
    update: TimeLineNode['update']
  }
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

const pointDistance = 60
const pointSize = 40
const pointOffset = pointSize / 4
const pointRadius = pointSize / 2
const offsetLeft = 100
const textOffsetLeft = 70
const lineWidth = 10
const secondaryLineOffset = textOffsetLeft - lineWidth * 2

const svg = ref()

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
      actions: {
        update: item.update,
        remove: item.remove,
      },
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
  svg.value = svg.value!.size('100%', `${height}px`)
  drawPrimaryPath(height, svg.value)
  drawSecondaryPath(svg.value)
}

function drawPrimaryPath(height: number, svg: SVG.Doc) {
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
  const textYOffset = pointOffset / 2
  svg.text(format(item.start.time, 'HH:mm:ss')).translate(0, startPointTranslateY - textYOffset)
  svg.circle(pointRadius).fill(item.color).translate(startPointTranslateX, startPointTranslateY)
  svg.text(item.name).fill(item.color).translate(startPointTranslateX + textOffsetLeft, startPointTranslateY - textYOffset)
  if (item.children) {
    // history 没有运行持续时间
    const text = item.totalTime
      ? t('timelineGraph.include', {
        count: item.children,
        totalTime: formatHHmmss(item.totalTime),
      })
      : t('timelineGraph.includeCount', {
        count: item.children,
      })
    svg.text(text).fill(item.color).translate(startPointTranslateX + textOffsetLeft, startPointTranslateY + 30)
  }
  svg.circle(pointRadius).fill(item.color).translate(endPointTranslateX, endPointTranslateY)
  svg.text(format(item.end.time, 'HH:mm:ss')).translate(0, endPointTranslateY - textYOffset)
}

onMounted(() => {
  svg.value = SVG('timeline-svg')
  draw()
})

watchDeep(() => props.list, () => {
  svg.value?.clear()
  draw()
})
</script>

<template>
  <div relative h-full overflow-y-auto>
    <div id="timeline-svg" p-4 />
    <v-hover v-for="{ start, end, color, actions } in nodeList" :key="start.y">
      <template #default="{ isHovering, props: hoverProps }">
        <div
          v-bind="hoverProps" absolute w-full hover:z-1 :style="{
            top: `${start.y}px`,
            left: `${start.x}px`,
            height: `${end.y - start.y + pointOffset * 3}px`,
            color,
          }"
        >
          <div
            absolute inset-0 bg-current transition-opacity rounded-md
            :class="isHovering ? 'opacity-20' : 'opacity-0'"
          />
          <v-menu v-if="actions.remove || actions.update">
            <template #activator="{ props: menuProps }">
              <v-btn
                icon v-bind="menuProps" size="x-small" bottom-2 right-2
                :class="classNames('absolute! transition-opacity!', isHovering ? 'opacity-100' : 'opacity-0')"
              >
                <div i-mdi:menu-down text-6 />
              </v-btn>
            </template>
            <v-list min-width="100">
              <v-list-item
                v-if="actions.remove" value="button.remove" :title="$t('button.remove')"
                append-icon="mdi-trash-can-outline" base-color="red" @click="() => actions.remove?.()"
              />
              <!-- <v-list-item
                v-if="actions.update" value="button.update" :title="$t('button.update')"
                append-icon="mdi-pencil-outline" @click="() => { }"
              /> -->
            </v-list>
          </v-menu>
        </div>
      </template>
    </v-hover>
  </div>
</template>
