import Database from '@tauri-apps/plugin-sql'
import { error } from '@tauri-apps/plugin-log'
import type { Insertable, SelectType, Updateable } from 'kysely'

import type { DatabaseExecutor } from './db'
import { DatabaseError, SqliteErrorEnum, createKyselyDatabaseWithModels, findSqliteMessageFields } from './db'
import type { Activity, Box, Domain, History, Label, Moment, Note, Overview, Plan, Program } from './transform-types'
export { DatabaseError } from './db'

class Executor implements DatabaseExecutor<Database> {
  database!: Database

  execute(query: string, bindValues?: unknown[] | undefined) {
    return this.database.execute(query, bindValues)
  }

  select<T>(query: string, bindValues?: unknown[] | undefined): Promise<T> {
    return this.database.select(query, bindValues)
  }

  handleError(err: string) {
    error(err)

    const match = err.match(/\(code: (\d+)\) (.+)/)
    const code = match?.[1] || SqliteErrorEnum.RAW
    const detail = match?.[2].trim() || ''
    const fields = findSqliteMessageFields(detail)

    return new DatabaseError(detail, Number(code), fields)
  }

  close() {
    return this.database.close()
  }

  async load() {
    this.database = await Database.load('sqlite:data.db')
  }
}

const executor = new Executor()
await executor.load()

export const db = createKyselyDatabaseWithModels(executor)

onAppClose(() => db.close(), Priority.Low)
onAppSuspend(() => db.close(), Priority.Low)
onAppResume(() => db.load(), Priority.High)

type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never
type IfNotNever<T, K> = T extends never ? never : K

type NonNeverSelectKeys<R> = {
  [K in keyof R]: IfNotNever<SelectType<R[K]>, K>;
}[keyof R]

type OptionalKeys<T> = { [K in keyof T]: T extends Record<K, T[K]> ? never : K }[keyof T]
type NonOptionalKeys<T> = { [K in keyof T]: T extends Record<K, T[K]> ? K : never }[keyof T]

type DeepSelectable<R> = DrainOuterGeneric<{
  [K in NonNeverSelectKeys<R> & NonOptionalKeys<R>]: SelectType<R[K]> extends object ? DeepSelectable<SelectType<R[K]>> : SelectType<R[K]>;
} & {
  [K in NonNeverSelectKeys<R> & OptionalKeys<R>]?: SelectType<R[K]> extends object ? DeepSelectable<SelectType<R[K]>> : SelectType<R[K]>;
}>

export type SelectProgram = DeepSelectable<Program>
export type SelectActivity = DeepSelectable<Activity>
export type SelectPlan = DeepSelectable<Plan>
export type SelectLabel = DeepSelectable<Label>
export type SelectNote = DeepSelectable<Note>
export type SelectMoment = DeepSelectable<Moment>
export type SelectOverview = DeepSelectable<Overview>
export type SelectBox = DeepSelectable<Box>
export type SelectHistory = DeepSelectable<History>
export type SelectDomain = DeepSelectable<Domain>

export type InsertPlan = Insertable<Plan>
export type InsertNote = Insertable<Note>
export type InsertLabel = Insertable<Label>
export type InsertProgram = Insertable<Program>
export type InsertOverview = Insertable<Overview>
export type InsertBox = Insertable<Box>
export type InsertHistory = Insertable<History>

export type UpdateOverview = Updateable<Overview>

export type { Models } from './db'
