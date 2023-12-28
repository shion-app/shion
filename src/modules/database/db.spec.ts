import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'

import { DatabaseError, SqliteErrorEnum, createKyselyDatabaseWithModels, findSqliteMessageFields } from './db'
import type { DatabaseExecutor, QueryResult } from './db'

let sqlite = new Database(':memory:')

function addMigrations(migrations: string[]) {
  for (const migration of migrations)
    sqlite.exec(migration)
}

function readMigrations(paths: string[]) {
  return paths.map(path => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), path), 'utf-8'))
}

function init() {
  addMigrations(readMigrations(['../../../prisma/migrations/20230923052127_/migration.sql']))
}

function reset() {
  sqlite = new Database(':memory:')
  init()
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
  handleError(e: InstanceType<Database.SqliteError>) {
    const fields = findSqliteMessageFields(e.message)
    return new DatabaseError(e.message, SqliteErrorEnum[e.code] || SqliteErrorEnum.RAW, fields)
  },
  async close() {
    try {
      sqlite.close()
    }
    catch {
      return false
    }
    return true
  },
}

beforeEach(reset)

const db = createKyselyDatabaseWithModels(executor)

describe('model', () => {
  it('insert', async () => {
    expect(await db.plan.insert({
      name: 'plan1',
      color: '#ffffff',
    })).toMatchInlineSnapshot(`
      {
        "lastInsertId": 1,
        "rowsAffected": 1,
      }
    `)
  })

  it('update', async () => {
    const { lastInsertId } = await db.plan.insert({
      name: 'plan1',
      color: '#ffffff',
    })
    await db.plan.update(lastInsertId, {
      name: 'plan2',
    })
    const [plan] = await db.plan.select({
      id: 1,
    })
    expect(plan.name).toBe('plan2')
  })

  it('remove', async () => {
    const { lastInsertId } = await db.plan.insert({
      name: 'plan1',
      color: '#ffffff',
    })
    await db.plan.remove(lastInsertId)
    const list = await db.plan.select()
    expect(list.length).toBe(0)
  })
})

async function createNoteData() {
  const { lastInsertId: planId } = await db.plan.insert({
    name: 'plan1',
    color: '#ffffff',
  })
  const { lastInsertId: labelId } = await db.label.insert({
    name: 'label1',
    color: '#ffffff',
    planId,
  })
  const [_, second] = await Promise.all([
    db.note.insert({
      start: 1696394545000,
      end: 1696394545000 + 60 * 1000,
      planId,
      labelId,
    }),
    db.note.insert({
      start: 1696395545000,
      end: 1696395545000 + 60 * 1000,
      planId,
      labelId,
    }),
    db.note.insert({
      start: 1696396545000,
      end: 1696396545000 + 60 * 1000,
      planId,
      labelId,
    }),
  ])
  await db.label.insert({
    name: 'label2',
    color: '#000000',
    planId,
  })
  await db.note.remove(second.lastInsertId)
}

async function createActivityData() {
  const { lastInsertId: programId } = await db.program.insert({
    name: 'program1',
    color: '#ffffff',
    path: 'D:\\folder',
    icon: '',
  })
  const [_, second] = await Promise.all([
    db.activity.insert({
      start: 1696394545000,
      end: 1696394545000 + 60 * 1000,
      programId,
    }),
    db.activity.insert({
      start: 1696395545000,
      end: 1696395545000 + 60 * 1000,
      programId,

    }),
    db.activity.insert({
      start: 1696396545000,
      end: 1696396545000 + 60 * 1000,
      programId,
    }),
  ])
  await db.activity.remove(second.lastInsertId)
}

describe('plan', () => {
  beforeEach(createNoteData)

  it('select all', async () => {
    expect(await db.plan.select()).toMatchInlineSnapshot(`
      [
        {
          "color": "#ffffff",
          "deletedAt": 0,
          "id": 1,
          "name": "plan1",
          "sort": 0,
          "totalTime": 120000,
        },
      ]
    `)
  })

  it('remove relation', async () => {
    await db.plan.removeRelation(1)
    expect((await db.plan.select()).length).toBe(0)
    expect((await db.label.select()).length).toBe(0)
    expect((await db.note.select()).length).toBe(0)
  })
})

describe('label', () => {
  beforeEach(createNoteData)

  it('select all', async () => {
    expect(await db.label.select()).toMatchInlineSnapshot(`
      [
        {
          "color": "#ffffff",
          "deletedAt": 0,
          "id": 1,
          "name": "label1",
          "planId": 1,
          "sort": 0,
          "totalTime": 120000,
        },
        {
          "color": "#000000",
          "deletedAt": 0,
          "id": 2,
          "name": "label2",
          "planId": 1,
          "sort": 0,
          "totalTime": 0,
        },
      ]
    `)
  })

  it('remove relation', async () => {
    await db.label.removeRelation(1)
    expect((await db.label.select()).length).toBe(1)
    expect((await db.note.select()).length).toBe(0)
  })
})

describe('note', () => {
  beforeEach(createNoteData)

  it('select by start and end', async () => {
    expect(await db.note.select({
      start: 1696394545000 - 1000,
      end: 1696396545000 + 1000,
    })).toMatchInlineSnapshot(`
      [
        {
          "deletedAt": 0,
          "end": 1696394605000,
          "id": 1,
          "label": {
            "color": "#ffffff",
            "deletedAt": 0,
            "id": 1,
            "name": "label1",
            "planId": 1,
            "sort": 0,
            "totalTime": 120000,
          },
          "labelId": 1,
          "plan": {
            "color": "#ffffff",
            "deletedAt": 0,
            "id": 1,
            "name": "plan1",
            "sort": 0,
            "totalTime": 120000,
          },
          "planId": 1,
          "start": 1696394545000,
        },
        {
          "deletedAt": 0,
          "end": 1696396605000,
          "id": 3,
          "label": {
            "color": "#ffffff",
            "deletedAt": 0,
            "id": 1,
            "name": "label1",
            "planId": 1,
            "sort": 0,
            "totalTime": 120000,
          },
          "labelId": 1,
          "plan": {
            "color": "#ffffff",
            "deletedAt": 0,
            "id": 1,
            "name": "plan1",
            "sort": 0,
            "totalTime": 120000,
          },
          "planId": 1,
          "start": 1696396545000,
        },
      ]
    `)
  })

  it('select by planId or labelId', async () => {
    expect((await db.note.select({
      planId: 1,
    })).length).toBe(2)
    expect((await db.note.select({
      labelId: 2,
    })).length).toBe(0)
  })
})

describe('program', () => {
  beforeEach(createActivityData)

  it('select all', async () => {
    expect(await db.program.select()).toMatchInlineSnapshot(`
      [
        {
          "color": "#ffffff",
          "deletedAt": 0,
          "icon": "",
          "id": 1,
          "name": "program1",
          "path": "D:\\\\folder",
          "sort": 0,
          "totalTime": 120000,
        },
      ]
    `)
  })

  it('remove relation', async () => {
    await db.program.removeRelation(1)
    expect((await db.program.select()).length).toBe(0)
    expect((await db.activity.select()).length).toBe(0)
  })
})

describe('activity', () => {
  beforeEach(createActivityData)

  it('select by start and end', async () => {
    expect(await db.activity.select({
      start: 1696394545000 - 1000,
      end: 1696396545000 + 1000,
    })).toMatchInlineSnapshot(`
      [
        {
          "deletedAt": 0,
          "end": 1696394605000,
          "id": 1,
          "program": {
            "color": "#ffffff",
            "deletedAt": 0,
            "icon": "",
            "id": 1,
            "name": "program1",
            "path": "D:\\\\folder",
            "sort": 0,
            "totalTime": 120000,
          },
          "programId": 1,
          "start": 1696394545000,
        },
        {
          "deletedAt": 0,
          "end": 1696396605000,
          "id": 3,
          "program": {
            "color": "#ffffff",
            "deletedAt": 0,
            "icon": "",
            "id": 1,
            "name": "program1",
            "path": "D:\\\\folder",
            "sort": 0,
            "totalTime": 120000,
          },
          "programId": 1,
          "start": 1696396545000,
        },
      ]
    `)
  })
})

describe('rest', () => {
  it('property', () => {
    expect(db.activity.table).toBe('activity')
  })

  // TODO: test case
  // it('rollback', () => {

  // })

  // it('error message', () => {

  // })
})
