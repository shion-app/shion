<script setup lang="ts">
import type { AddRemoveFcn, GridStackWidget } from 'gridstack'
import { GridStack } from 'gridstack'
import { render } from 'vue'

import GridItem from './GridItem.vue'

const props = defineProps<{
  items: GridStackWidget[]
  componentProps: Array<{
    id: string
    data: any
  }>
}>()

const slots = defineSlots<{
  default(props: { componentProps }): any
}>()

let grid: GridStack | null = null
// const items: GridStackWidget[] = [
//   { id: '1', x: 1, y: 1, h: 2, w: 8 },
//   // { id: '2', x: 2, y: 4, w: 3 },
//   // { id: '3', x: 4, y: 2 },
//   // { id: '4', x: 3, y: 1, h: 2 },
//   // { id: '5', x: 0, y: 6, w: 2, h: 2 },
// ]
const shadowDom = {}

const gsAddRemoveVueComponents: AddRemoveFcn = (host, item, add, isGrid) => {
  if (!host)
    return

  if (isGrid)
    return

  const itemId = item.id!
  if (add) {
    const componentProps = props.componentProps.find(i => i.id == itemId)
    const itemVNode = h(
      GridItem,
      null,
      {
        default: componentProps
          ? () => slots.default?.({
              componentProps: componentProps.data,
            })
          : undefined,
      },
    )
    shadowDom[itemId] = document.createElement('div')
    render(itemVNode, shadowDom[itemId])
    return itemVNode.el as HTMLElement
  }
  else {
    render(null, shadowDom[itemId])
  }
}

onMounted(() => {
  grid = GridStack.init({
    float: true,
    cellHeight: '70px',
  })

  GridStack.addRemoveCB = gsAddRemoveVueComponents

  grid.load(props.items)
})
</script>

<template>
  <div class="grid-stack" />
</template>
