<script setup lang="ts" generic="T extends { id: number }">
import type { GridStackOptions, GridStackWidget } from 'gridstack'
import { GridStack } from 'gridstack'
import { nanoid } from 'nanoid'

const props = defineProps<{
  items: GridStackWidget[]
  componentProps: Array<T>
  options?: GridStackOptions
}>()

const emit = defineEmits<{
  (e: 'change', items: number[], widgets: GridStackWidget[]): void
}>()

defineSlots<{
  default(props: { componentProps: T }): any
}>()

const { column } = useGridColumn()
const { toggleDrag, dragged, toggleIsGrid } = layoutInject()

let grid: GridStack | null = null
const gridId = `grid-stack-${nanoid()}`

toggleIsGrid(true)

function compact() {
  if (!grid)
    return

  grid.compact()
  const widgets = grid.save() as GridStackWidget[]
  emit('change', widgets.map(i => Number(i.id)), widgets)
}

const item = (id: string) => `${gridId}-item-${id}`

onMounted(() => {
  grid = GridStack.init({
    margin: 0,
    disableResize: true,
    disableDrag: true,
    column: column.value,
    ...props.options,
  }, gridId)

  grid.setAnimation(false)

  grid.on('dragstop', compact)
})

watchArray(() => props.items, (newList, oldList) => {
  for (const gridItem of newList) {
    if (!oldList.find(i => i.id == gridItem.id)) {
      nextTick(() => {
        grid?.makeWidget(`#${item(gridItem.id!)}`)
        compact()
      })
    }
    else {
      grid?.update(`#${item(gridItem.id!)}`, gridItem)
    }
  }
  for (const { id } of oldList) {
    if (!newList.find(i => i.id == id)) {
      grid?.removeWidget(`#${item(id!)}`)
      compact()
    }
  }
})

watch(column, v => grid?.column(v))

watch(dragged, (v) => {
  grid?.enableMove(v)
})

onBeforeUnmount(() => {
  toggleDrag(false)
  toggleIsGrid(false)
})
</script>

<template>
  <div :class="gridId">
    <div v-for="w in props.items" :id="item(w.id!)" :key="w.id" class="grid-stack-item" :gs-x="w.x" :gs-y="w.y" :gs-w="w.w" :gs-h="w.h" :gs-id="w.id">
      <div class="grid-stack-item-content overflow-visible!" p-3 flex flex-col>
        <slot :component-props="props.componentProps.find(i => i.id == Number(w.id))!" />
      </div>
    </div>
  </div>
</template>
