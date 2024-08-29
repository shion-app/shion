import type { ObsidianNote } from '@/hooks/useObsidian'
import type { SelectActivity, SelectHistory, SelectNote, SelectRemark } from '@/modules/database'

export type Replace<T, U extends { [K in keyof T]?: unknown }> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
}

export interface TimeLineNode {
  start: number
  end: number
  title: string
  color: string
  children?: TimeLineNodeItem[]
  type: 'note' | 'activity' | 'history' | 'remark' | 'moment'
  raw: SelectNote | SelectActivity | SelectHistory | SelectRemark | ObsidianNote
}

export interface TimeLineNodeItem {
  start: number
  end: number
  color: string
}

export interface TimeLineNodeCommonGraphData {
  title: string
  children: number
  totalTime: number
}

export interface TimeLineNodeGraphData {
  common: TimeLineNodeCommonGraphData
  type: TimeLineNode['type']
  raw: TimeLineNode['raw']
}

export interface NestedMenuItem {
  title: string
  value: string | number
  children?: Array<NestedMenuItem>
}

export type NestedMenuItemValue = NestedMenuItem['value']

export * from '@/components/modal/types'
