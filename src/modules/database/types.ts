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
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Box {
  id: Generated<number>
  name: string
  color: string
  sort: Generated<number>
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Domain {
  id: Generated<number>
  name: string
  color: string
  pattern: string
  sort: Generated<number>
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface History {
  id: Generated<number>
  title: string
  url: string
  lastVisited: number
  domainId: number
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Label {
  id: Generated<number>
  name: string
  color: string
  sort: Generated<number>
  planId: number
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Link {
  id: Generated<number>
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Moment {
  id: Generated<number>
  title: string
  content: string
  boxId: number
  linkId: number | null
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Note {
  id: Generated<number>
  start: number
  end: number
  planId: number
  labelId: number
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Overview {
  id: Generated<number>
  type: number
  x: number
  y: number
  w: number
  h: number
  data: string
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Plan {
  id: Generated<number>
  name: string
  color: string
  sort: Generated<number>
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Program {
  id: Generated<number>
  name: string
  color: string
  path: string
  icon: string
  platform: string
  sort: Generated<number>
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface Remark {
  id: Generated<number>
  title: string
  desc: string
  arg: string
  time: number
  programId: number
  deletedAt: Generated<number>
  createdAt: Generated<number>
  updatedAt: Generated<number>
}
export interface DB {
  activity: Activity
  box: Box
  domain: Domain
  history: History
  label: Label
  link: Link
  moment: Moment
  note: Note
  overview: Overview
  plan: Plan
  program: Program
  remark: Remark
}
