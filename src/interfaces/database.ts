export type TableName = 'plan' | 'note' | 'label' | 'note_label' | 'sync_log'

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
  labels?: Array<Label>
}

export interface Label {
  id: number
  name: string
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
