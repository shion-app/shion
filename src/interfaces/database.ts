export interface Plan {
  id: number
  name: string
  color: string
  totalTime: number
}

export interface Note {
  id: number
  startTime: number
  endTime: number
  description: string
  planId: number
}

export interface Label {
  id: number
  name: string
  planId: number
  totalTime: number
}
