export interface TimeblockNode {
  start: number
  end: number
  name: string
  color: string
  canvasEnd: number
}

export interface TimeblockEventNode extends TimeblockNode {
  parallelCount: number
  parallelLine: number
}
