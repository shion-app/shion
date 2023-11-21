import type { GridStackWidget } from 'gridstack'

export function useGrid() {
  const COLUMN = 12

  function getItemsByOrder(list: Array<{ id: number }>): GridStackWidget[] {
    const span = 4
    const count = COLUMN / span
    return list.map((i, index) => ({
      id: String(i.id),
      x: (index % count) * span,
      y: Math.floor(index / count),
      w: span,
      h: 1,
    }))
  }

  return {
    getItemsByOrder,
  }
}
