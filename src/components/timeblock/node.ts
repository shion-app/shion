import { isSameDay } from 'date-fns'

import type { TimeblockEventNode, TimeblockNode } from './types'

export class Pool {
  #grid: TimeblockNode[][] = []
  #current: TimeblockNode[] = []
  #start = 0
  #end = 0

  add(node: TimeblockNode) {
    if (this.#start == 0 && this.#end == 0) {
      this.#start = node.start
      this.#end = node.canvasEnd
      this.#current.push(node)
      return
    }
    if (this.#overlap(node)) {
      this.#start = Math.min(this.#start, node.start)
      this.#end = Math.max(this.#end, node.canvasEnd)
      this.#current.push(node)
    }
    else {
      this.#clear()
      this.add(node)
    }
  }

  calcLayout() {
    this.#clear()
    return this.#grid.flatMap(this.#calcList)
  }

  #clear() {
    this.#grid.push(this.#current)
    this.#current = []
    this.#start = 0
    this.#end = 0
  }

  #calcList(list: TimeblockNode[]): TimeblockEventNode[] {
    if (list.length == 1) {
      return list.map(node => ({
        ...node,
        parallelCount: 1,
        parallelLine: 1,
      }))
    }

    let sort = list.flatMap(i => [i.start, i.canvasEnd]).sort((a, b) => a - b)
    const data: TimeblockNode[][] = []
    let temp: TimeblockNode[] = []
    while (list.length) {
      const index = list.findIndex(i => sort.includes(i.start) && sort.includes(i.canvasEnd))
      const node = list[index]
      if (node) {
        temp.push(node)
        list.splice(index, 1)
        const startIndex = sort.indexOf(node.start)
        const endIndex = sort.indexOf(node.canvasEnd)
        sort = [...sort.slice(0, startIndex), ...sort.slice(endIndex + 1)]
      }
      else {
        data.push(temp)
        temp = []
        sort = list.flatMap(i => [i.start, i.canvasEnd]).sort((a, b) => a - b)
      }
    }

    data.push(temp)

    return data.flatMap((list, index) => list.map(node => ({
      ...node,
      parallelCount: data.length,
      parallelLine: index + 1,
    })))
  }

  #overlap(node: TimeblockNode) {
    // 排除隔天并列
    if (!isSameDay(node.start, this.#start))
      return false

    return (this.#start <= node.start && this.#end > node.start) || (this.#start < node.canvasEnd && this.#end > node.canvasEnd)
  }
}
