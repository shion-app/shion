<script setup lang="ts" generic="T extends { id: number }">
import type { AddRemoveFcn, GridStackOptions, GridStackWidget } from 'gridstack'
import { GridStack } from 'gridstack'
import { render } from 'vue'
import { nanoid } from 'nanoid'

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
const gridId = `grid-stack-${nanoid()}`

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
  }, gridId)

  grid.on('dragstop', () => {
    grid!.compact()
    const widgets = grid!.save() as GridStackWidget[]
    emit('change', widgets.map(i => Number(i.id)))
  })

  grid.load(props.items, gsAddRemoveVueComponents)
})

watchDeep(() => props.componentProps, () => {
  grid?.removeAll()
  grid?.load(props.items, gsAddRemoveVueComponents)
})
</script>

<template>
  <div :class="gridId" />
</template>
