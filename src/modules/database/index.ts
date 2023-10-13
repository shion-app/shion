import Database from 'tauri-plugin-sql-api'
import { error } from 'tauri-plugin-log-api'
import type { Selectable } from 'kysely'

import type { DatabaseExecutor } from './db'
import { DatabaseError, SqliteErrorEnum, createKyselyDatabaseWithModels, findSqliteMessageFields } from './db'
import type { Activity, Label, Note, Plan, Program } from './transform-types'
export { DatabaseError } from './db'

const database = await Database.load('sqlite:data.db')

const executor: DatabaseExecutor = {
  execute(...args) {
    return database.execute(...args)
  },
  select(...args) {
    return database.select(...args)
  },
  handleError(err: string) {
    error(err)

    const match = err.match(/\(code: (\d+)\) (.+)/)
    const code = match?.[1] || SqliteErrorEnum.RAW
    const detail = match?.[2].trim() || ''
    const fields = findSqliteMessageFields(detail)

    return new DatabaseError(detail, Number(code), fields)
  },
}

export const db = createKyselyDatabaseWithModels(executor)

export type SelectProgram = Selectable<Program>
export type SelectActivity = Selectable<Activity>
export type SelectPlan = Selectable<Plan>
export type SelectLabel = Selectable<Label>
export type SelectNote = Selectable<Note>
