import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import Database from 'better-sqlite3'
import { expect, it } from 'vitest'

import { createKyselyDatabaseWithModels } from './db'
import type { DatabaseExecutor, QueryResult } from './db'

const sqlite = new Database(':memory:')

function addMigrations(migrations: string[]) {
  for (const migration of migrations)
    sqlite.exec(migration)
}

function readMigration(path: string) {
  return readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), path), 'utf-8')
}

const executor: DatabaseExecutor = {
  select(query, bindValues) {
    return Promise.resolve<any>(sqlite.prepare(query).all(...(bindValues || [])))
  },
  execute(query, bindValues) {
    const { changes, lastInsertRowid } = sqlite.prepare(query).run(...(bindValues || []))
    return Promise.resolve<QueryResult>({
      lastInsertId: lastInsertRowid as number,
      rowsAffected: changes,
    })
  },
}

const db = createKyselyDatabaseWithModels(executor)

addMigrations([readMigration('../../../prisma/migrations/20230923052127_/migration.sql')])

it('note', async () => {
  expect(await db.plan.insert({
    color: 'blue',
    name: '1',
  })).toMatchInlineSnapshot(`
    {
      "lastInsertId": 1,
      "rowsAffected": 1,
    }
  `)
  expect(await db.plan.select()).toMatchInlineSnapshot(`
    [
      {
        "color": "blue",
        "deletedAt": 0,
        "id": 1,
        "name": "1",
        "sort": 0,
        "totalTime": 0,
      },
    ]
  `)
})
