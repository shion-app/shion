import Database from 'tauri-plugin-sql-api'
import { createKyselyDatabaseWithModels } from './db'

const database = await Database.load('sqlite:data.db')

export const db = createKyselyDatabaseWithModels(database)
