<script setup lang="ts" generic="T extends { id: number }">
import type { Layout } from 'grid-layout-plus'
import { GridItem, GridLayout } from 'grid-layout-plus'

const props = defineProps<{
  items: Layout
  componentProps: Array<T>
  options?: {
    cellHeight: number
  }
}>()

const emit = defineEmits<{
  (e: 'layoutUpdated', list: number[], layout: Layout): void
  (e: 'columnChanged', col: number): void
}>()

defineSlots<{
  default(props: { componentProps: T }): any
}>()

const { items: layout } = useVModels(props)

const { column } = useGridColumn()
const { toggleDrag, dragged, toggleIsGrid } = layoutInject()

let inited = false

toggleIsGrid(true)

function handleLayoutUpdated(newLayout: Layout) {
  if (!inited) {
    inited = true
    return
  }
  const list = sortByLocation(newLayout).map(i => Number(i.i))
  emit('layoutUpdated', list, newLayout)
}

function stopClickIfDraggable(e: Event) {
  if (dragged.value)
    e.stopPropagation()
}

watch(column, (v) => {
  emit('columnChanged', v)
})

onBeforeUnmount(() => {
  toggleDrag(false)
  toggleIsGrid(false)
})
</script>

<template>
  <GridLayout
    v-model:layout="layout" :col-num="column" :row-height="props.options?.cellHeight" :is-draggable="dragged"
    :is-resizable="false" vertical-compact :use-css-transforms="false" :margin="[20, 20]"
    @layout-updated="handleLayoutUpdated"
  >
    <GridItem
      v-for="item in layout" :key="item.i" class="grid-stack-item" :x="item.x" :y="item.y" :w="item.w"
      :h="item.h" :i="item.i" @click.capture="stopClickIfDraggable"
    >
      <slot :component-props="props.componentProps.find(i => i.id == Number(item.i))!" />
    </GridItem>
  </GridLayout>
</template>

<style scoped>
:deep(.grid-stack-item > *) {
  height: 100%;
}
</style>

<style>
.vgl-layout {
  --vgl-placeholder-bg: gray !important;
}
</style>
