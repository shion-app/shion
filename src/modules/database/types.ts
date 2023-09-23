import type { ColumnType } from 'kysely'
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface Activity {
  id: Generated<number>
  start: number
  end: number
  programId: number
  deletedAt: Generated<number>
}
export interface Label {
  id: Generated<number>
  name: string
  color: string
  sort: number
  planId: number
  deletedAt: Generated<number>
}
export interface Plan {
  id: Generated<number>
  name: string
  color: string
  sort: number
  deletedAt: Generated<number>
}
export interface Program {
  id: Generated<number>
  name: string
  color: string
  path: string
  icon: string
  sort: number
  deletedAt: Generated<number>
}
export interface Record {
  id: Generated<number>
  start: number
  end: number
  planId: number
  labelId: number
  deletedAt: Generated<number>
}
export interface DB {
  activity: Activity
  label: Label
  plan: Plan
  program: Program
  record: Record
}
