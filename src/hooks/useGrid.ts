import type { GridStackWidget } from 'gridstack'

export function useGrid() {
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

  return {
    getItemsByOrder,
    col,
  }
}
