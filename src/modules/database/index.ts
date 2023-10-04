import Database from 'tauri-plugin-sql-api'
import { error } from 'tauri-plugin-log-api'
import type { DatabaseExecutor } from './db'
import { createKyselyDatabaseWithModels } from './db'

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
