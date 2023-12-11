import type { GridStackWidget } from 'gridstack'

export type GridList<T> = Array<T & { selected: boolean }>

export function useGrid(list: Ref<GridList<{ id: number }>>) {
  const COLUMN = 12
  const SPAN = 4

  function getItemsByOrder(list: Array<{ id: number }>): GridStackWidget[] {
    const count = COLUMN / SPAN
    return list.map((i, index) => ({
      id: String(i.id),
      x: (index % count) * SPAN,
      y: Math.floor(index / count),
      w: SPAN,
      h: 1,
    }))
  }

  const col = (column: number) => SPAN * column

  function wrap<T extends object>(list: Array<T>) {
    return list.map(i => ({
      ...i,
      selected: false,
    }))
  }

  function select(id: number, selected: boolean) {
    for (const item of list.value) {
      if (item.id == id) {
        item.selected = selected
        break
      }
    }
  }

  const selectedList = computed(() => list.value.filter(i => i.selected).map(i => i.id))

  const items = computed<GridStackWidget[]>(() => getItemsByOrder(list.value))

  return {
    getItemsByOrder,
    col,
    wrap,
    select,
    selectedList,
    items,
  }
}
