import type { ColumnType } from 'kysely'
import type * as origin from './types'

type TotalTime = ColumnType<number, never, never>

export type Program = origin.Program & { totalTime: TotalTime }

export type Activity = origin.Activity & { program: ColumnType<Program, never, never> }

export type Label = origin.Label & { totalTime: TotalTime }

export type Plan = origin.Plan & { totalTime: TotalTime }

export type Note = origin.Note & { plan: ColumnType<Plan, never, never>; label: ColumnType<Label, never, never> }

export type Moment = origin.Moment

export interface DB {
  activity: Activity
  label: Label
  plan: Plan
  program: Program
  note: Note
  moment: Moment
}
