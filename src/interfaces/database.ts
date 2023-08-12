export type TableName = 'plan' | 'note' | 'label' | 'sync_log' | 'program' | 'activity'

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
}

export interface RecentNote {
  planId: number
  labelId: number
  planName: string
  labelName: string
  planColor: string
  labelColor: string
  date: string
  totalTime: number
}

export interface Label {
  id: number
  name: string
  color: string
  planId: number
  totalTime: number
}

export interface SyncLog {
  id: number
  tableName: Exclude<TableName, 'sync_log'>
  type: 'insert' | 'update'
  data: string
  sync: boolean
}

export interface Program {
  id: number
  path: string
  description: string
  icon: number[]
}

export interface Activity {
  id: number
  startTime: number
  endTime: number
  programId: number
}
