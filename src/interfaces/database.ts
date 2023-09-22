export type TableName = 'plan' | 'note' | 'label' | 'program' | 'activity'

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
  labelId: number
  label: Label
  plan: Plan
}

export interface Label {
  id: number
  name: string
  color: string
  planId: number
  totalTime: number
}

export interface Program {
  id: number
  path: string
  description: string
  icon: number[]
  color: string
  totalTime: number
}

export interface Activity {
  id: number
  startTime: number
  endTime: number
  programId: number
  program: Program
}
