import type { main } from '../../wailsjs/go/models'

export type RawRecord = Pick<main.Record, 'name' | 'type' | 'exe'>

export interface RawLabel {
  name: string
  recordId: number
}

export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T
