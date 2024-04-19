import type { ColumnType } from 'kysely'

import type * as origin from './types'
import type { WidgetType } from './models/overview'
import type { Replace } from '@/interfaces'

type TotalTime = ColumnType<number, never, never>

export type Program = origin.Program & { totalTime: TotalTime }

export type Activity = origin.Activity & { program: ColumnType<Program, never, never> }

export type Label = origin.Label & { totalTime: TotalTime }

export type Plan = origin.Plan & { totalTime: TotalTime }

export type Note = origin.Note & { plan: ColumnType<Plan, never, never>; label: ColumnType<Label, never, never> }

export type Moment = origin.Moment & { box: ColumnType<Box, never, never> }

export type Box = origin.Box & { itemCount: ColumnType<number, never, never> }

export type Link = origin.Link

export type Domain = origin.Domain & { itemCount: ColumnType<number, never, never> }

export type History = origin.History & { domain: ColumnType<Domain, never, never> }

export type Overview = Replace<origin.Overview, {
  type: WidgetType
  data: {
    fields?: Record<string, unknown>
    query?: {
      table: string
      where: Record<string, unknown>
    }
    widget?: Record<string, unknown>
  }
}>

export interface DB {
  activity: Activity
  label: Label
  plan: Plan
  program: Program
  note: Note
  moment: Moment
  overview: Overview
  box: Box
  link: Link
  domain: Domain
  history: History
}
