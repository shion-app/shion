<script setup lang="ts">
import SVG from 'svg.js'
import classNames from 'classnames'

import type { TimeLineNode } from '@/interfaces'
import website from '@/assets/website.svg'

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
  url?: string
  level: 'primary' | 'secondary'
  icon?: string
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
})

const { t } = useI18n()
const { format, formatHHmmss } = useDateFns()
const { open: openUpdateForm, close: closeUpdateForm, setModelValue, model } = useFormModal<{
  start: number
  end: number
}>(
  (model) => {
    return {
      attrs: {
        title: t('timelineGraph.update.title'),
        form: {
          fields: [
            {
              type: 'datetimePicker',
              key: 'start',
              label: t('timelineGraph.update.start'),
              props: {
                max: model.end,
              },
            },
            {
              type: 'datetimePicker',
              key: 'end',
              label: t('timelineGraph.update.end'),
              props: {
                min: model.start,
              },
            },
          ],
        },
        schema: z => z.object({
          start: z.number(),
          end: z.number(),
        }),
        async onConfirm() {
          closeUpdateForm()
        },
      },
    }
  })

const pointDistance = 60
const pointSize = 40
const pointOffset = pointSize / 4
const pointRadius = pointSize / 2
const offsetLeft = 100
const textOffsetLeft = 70
const lineWidth = 10
const secondaryLineOffset = textOffsetLeft - lineWidth * 2

const svg = ref()
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
      url: item.url,
      level: isSibling ? 'primary' : 'secondary',
      icon: item.icon,
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

  let closest = Infinity
  let closestItem: HTMLElement | undefined
  for (const item of graphItemRef.value) {
    const time = Number(item.dataset.start)
    const current = Math.abs(viewportTime - time)
    if (current < closest) {
      closest = current
      closestItem = item
    }
  }
  closestItem?.scrollIntoView()
}

async function updateGraphItem(start: number, end: number, update: GraphItem['actions']['update']) {
  if (!update)
    return

  setModelValue({
    start,
    end,
  })
  await openUpdateForm()
  update({
    start: model.value.start,
    end: model.value.end,
  })
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
    <v-hover v-for="{ start, end, actions, name, children, totalTime, url, level, icon } in nodeList" :key="start.y">
      <template #default="{ isHovering, props: hoverProps }">
        <div
          v-bind="hoverProps" :ref="graphItemRef.set" absolute w-full :style="{
            top: `${start.y}px`,
            left: `${start.x}px`,
            height: `${end.y - start.y + pointOffset * 3}px`,
          }" :class="{
            'z-1': level == 'primary',
          }" :data-start="start.time"
        >
          <div
            absolute inset-0 transition-opacity rounded-md :class="[
              (actions.remove || actions.update)
                ? isHovering
                  ? 'opacity-20'
                  : 'opacity-0'
                : '',
              (actions.remove || actions.update) ? 'bg-current' : '']"
          />
          <div
            absolute inset-0 pr-2 :style="{
              paddingLeft: `${offsetLeft + pointOffset + textOffsetLeft}px`,
              paddingTop: `${pointOffset / 2}px`,
            }"
          >
            <div flex items-start>
              <div v-if="icon" class="w-[16px] h-[16px]" mr-2 mt-1>
                <v-img :src="icon" :width="16" :height="16">
                  <template #error>
                    <v-img :src="website" :width="16" :height="16" />
                  </template>
                </v-img>
              </div>
              <div space-y-2>
                <div :class="children ? 'line-clamp-2' : 'line-clamp-1'">
                  <a v-if="url" target="_blank" :href="url" :title="name" break-all>{{ name }}</a>
                  <div v-else>
                    {{ name }}
                  </div>
                </div>
                <div v-if="children">
                  {{ totalTime
                    ? t('timelineGraph.include', {
                      count: children,
                      totalTime: formatHHmmss(totalTime),
                    })
                    : t('timelineGraph.includeCount', {
                      count: children,
                    }) }}
                </div>
              </div>
            </div>
          </div>
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
              <v-list-item
                v-if="actions.update" value="button.update" :title="$t('button.update')"
                append-icon="mdi-pencil-outline" @click="() => updateGraphItem(start.time, end.time, actions.update)"
              />
            </v-list>
          </v-menu>
        </div>
      </template>
    </v-hover>
  </div>
</template>
