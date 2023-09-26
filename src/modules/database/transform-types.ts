import type { Activity, Label, Program as OriginProgram, Plan, Record } from './types'

type Replace<T, U> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
}

export type Program = Replace<OriginProgram, { icon: number[] }>

export { Activity, Label, Plan, Record } from './types'

export interface DB {
  activity: Activity
  label: Label
  plan: Plan
  program: Program
  record: Record
}
