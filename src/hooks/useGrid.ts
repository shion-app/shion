import type { GridStackWidget } from 'gridstack'

export type GridList<T> = Array<T & { selected: boolean }>

const SPAN = 4

export function useGridColumn() {
  const { sm, xl } = useTailwindBreakpoints()

  const column = computed(() => {
    if (xl.value)
      return 16

    if (sm.value)
      return 12

    return 8
  })

  const col = (unrealCol: number) => SPAN * unrealCol

  const count = (realCol: number) => realCol / SPAN

  return {
    column,
    col,
    count,
  }
}

export function useGrid(list: Ref<GridList<{ id: number }>>) {
  const { column } = useGridColumn()

  function getItemsByOrder(list: Array<{ id: number }>): GridStackWidget[] {
    const count = column.value / SPAN
    return list.map((i, index) => ({
      id: String(i.id),
      x: (index % count) * SPAN,
      y: Math.floor(index / count),
      w: SPAN,
      h: 1,
    }))
  }

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
    wrap,
    select,
    selectedList,
    items,
  }
}
