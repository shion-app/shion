import type { ColumnType } from 'kysely'
import type * as origin from './types'

type Replace<T, U> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
}

type TotalTime = ColumnType<number, never, never>

export type Program = Replace<origin.Program, { icon: number[] }> & { totalTime: TotalTime }

export type Activity = origin.Activity & { program: ColumnType<Program, never, never> }

export { Label, Plan, Record } from './types'

export interface DB {
  activity: Activity
  label: origin.Label
  plan: origin.Plan
  program: Program
  record: origin.Record
}
