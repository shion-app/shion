import Database from 'tauri-plugin-sql-api'
import { error } from 'tauri-plugin-log-api'
import type { Selectable } from 'kysely'

import type { DatabaseExecutor } from './db'
import { createKyselyDatabaseWithModels } from './db'
import type { Activity, Label, Note, Plan, Program } from './transform-types'

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
    // TODO: format error
    return err
  },
}

export const db = createKyselyDatabaseWithModels(executor)

export type SelectProgram = Selectable<Program>
export type SelectActivity = Selectable<Activity>
export type SelectPlan = Selectable<Plan>
export type SelectLabel = Selectable<Label>
export type SelectNote = Selectable<Note>
