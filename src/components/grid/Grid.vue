<script setup lang="ts" generic="T extends { id: number }">
import type { AddRemoveFcn, GridStackNode, GridStackOptions, GridStackWidget } from 'gridstack'
import { GridStack } from 'gridstack'
import { render } from 'vue'

import GridItem from './GridItem.vue'

const props = defineProps<{
  items: GridStackWidget[]
  componentProps: Array<T>
  options?: GridStackOptions
}>()

const emit = defineEmits<{
  (e: 'change', items: number[]): void
}>()

const slots = defineSlots<{
  default(props: { componentProps: T }): any
}>()

const instance = getCurrentInstance()

let grid: GridStack | null = null

const shadowDom = {}

const gsAddRemoveVueComponents: AddRemoveFcn = (host, item, add, isGrid) => {
  if (!host)
    return

  if (isGrid)
    return

  const itemId = Number(item.id)
  if (add) {
    const componentProps = props.componentProps.find(i => i.id == itemId)
    const itemVNode = h(
      GridItem,
      null,
      {
        default: componentProps
          ? () => slots.default({
              componentProps,
            })
          : undefined,
      },
    )
    shadowDom[itemId] = document.createElement('div')
    itemVNode.appContext = instance!.appContext
    render(itemVNode, shadowDom[itemId])
    return itemVNode.el as HTMLElement
  }
  else {
    render(null, shadowDom[itemId])
  }
}

onMounted(() => {
  grid = GridStack.init({
    margin: 0,
    disableResize: true,
    ...props.options,
  })

  grid.on('change', (event: Event, items: GridStackNode[]) => {
    emit('change', items.map(i => Number(i.id)))
    grid!.compact()
  })

  GridStack.addRemoveCB = gsAddRemoveVueComponents

  grid.load(props.items)
})

watchDeep(() => props.items, () => {
  grid?.load(props.items)
})
</script>

<template>
  <div class="grid-stack" />
</template>
