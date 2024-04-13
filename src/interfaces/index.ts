export type Replace<T, U extends { [K in keyof T]?: unknown }> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
}

export interface TimeLineNode {
  start: number
  end: number
  name: string
  color: string
  children?: TimeLineNode[]
  remove?: () => Promise<void>
  update?: (data: { start?: number; end?: number }) => Promise<void>
}

export interface NestedMenuItem {
  title: string
  value: string | number
  children?: Array<NestedMenuItem>
}

export type NestedMenuItemValue = NestedMenuItem['value']

export * from '@/components/modal/types'
