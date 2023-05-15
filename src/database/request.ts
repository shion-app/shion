import Database from 'tauri-plugin-sql-api'
import { snakeCase } from 'snake-case'
import { camelCase } from 'camel-case'

import { i18n } from '@locales/index'
import type { Label, Note, Plan } from '@interfaces/index'

const PATH = `sqlite:data${import.meta.env.DEV ? '-dev' : ''}.db`

const enum SqliteError {
  UNHANDLED = -1,
  SQLITE_CONSTRAINT_UNIQUE = 2067,
}

function parseError(error) {
  const match = /\(code: (\d+)\)/.exec(error)!
  const code = +match[1]
  return parseMessage(code, error)
}

function parseMessage(code: SqliteError, error) {
  switch (code) {
    case SqliteError.SQLITE_CONSTRAINT_UNIQUE: {
      const match = /UNIQUE constraint failed:(.*)/.exec(error)!
      const uniqueKeyList = match[1].split(',').map(i => i.trim().split('.')[1]).filter(i => i != 'deleted_at').map(i => camelCase(i))
      // @ts-expect-error: Type instantiation is excessively deep and possibly infinite.ts(2589)
      return i18n.global.t('error.unique', {
        field: uniqueKeyList.join(', '),
      })
    }
    default:
      return i18n.global.t('error.unhandle', {
        content: error,
      })
  }
}

const db = await Database.load(PATH)

type CreateNote = Pick<Note, 'startTime' | 'endTime' | 'planId'> & Partial<Pick<Note, 'description'>>

type CreatePlan = Pick<Plan, 'name' | 'color'>

type CreateLabel = Pick<Label, 'name' | 'planId'>

type TableName = 'plan' | 'note' | 'label' | 'note_label'

async function create(table: TableName, data: Record<string, unknown>) {
  const key = Object.keys(data).map(key => snakeCase(key)).join(', ')
  const placeholder = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')
  const value = Object.values(data)
  try {
    return await db.execute(`INSERT INTO ${table} (${key}) VALUES (${placeholder})`, value)
  }
  catch (error) {
    return Promise.reject(parseError(error))
  }
}

async function update(table: TableName, id: number, data: Record<string, unknown>) {
  const placeholder = Object.entries(data).map(([k], i) => `${snakeCase(k)} = $${i + 1}`).join(', ')
  const value = Object.values(data)
  try {
    return await db.execute(`UPDATE ${table} SET ${placeholder} WHERE id = ${id}`, value)
  }
  catch (error) {
    return Promise.reject(parseError(error))
  }
}

function remove(table: TableName, id: number) {
  return db.execute(`UPDATE ${table} SET deleted_at = datetime('now', 'localtime') WHERE id = ${id}`)
}

function select<T>(query: string, bindValues?: unknown[]): Promise<T> {
  return db.select(query, bindValues).then(data => filterColumn(data))
}

function filterColumn(data) {
  return data.map((i) => {
    delete i.deleted_at
    const obj = {}
    for (const key in i)
      obj[camelCase(key)] = i[key]

    return obj
  })
}

export function createPlan(data: CreatePlan) {
  return create('plan', data)
}

export function updatePlan(id: number, data: Partial<CreatePlan>) {
  return update('plan', id, data)
}

export function removePlan(id: number) {
  return remove('plan', id)
}

export async function selectPlan() {
  const data = await select<Array<Plan>>('SELECT * FROM plan WHERE deleted_at = 0 ORDER BY id')
  const list = (await Promise.all(data.map(({ id }) => selectPlanTotalTime(id))))
  data.forEach((plan, index) => plan.totalTime = list[index].totalTime)
  return data
}

function selectPlanTotalTime(id: number) {
  return select<Array<Pick<Plan, 'totalTime'>>>(`
    SELECT IFNULL(sum(end_time - start_time), 0) AS total_time
      FROM note
    WHERE plan_id = ${id} AND
      deleted_at = 0
  `).then(i => i.pop()!)
}

export function createNote(data: CreateNote) {
  return create('note', data)
}

export function updateNote(id: number, data: Partial<CreateNote>) {
  return update('note', id, data)
}

export function removeNote(id: number) {
  return remove('note', id)
}

export function selectNoteByPlanId(id: number, start: number, end: number) {
  return select<Array<Note>>(`
    SELECT *
      FROM note
    WHERE start_time > $1 AND
      start_time < $2 AND
      plan_id = ${id} AND
      deleted_at = 0
    ORDER BY start_time`, [start, end]).then(data => data.map((note) => {
    if (!note.description)
      note.description = ''

    return note
  }))
}

export function selectNoteByLabelId(id: number, start: number, end: number) {
  return select<Array<Note>>(`
    SELECT note.*
      FROM note,
          note_label
    WHERE note_label.label_id = ${id} AND
      note_label.note_id = note.id AND
      start_time > $1 AND
      start_time < $2 AND
      note.deleted_at = 0
    ORDER BY start_time`, [start, end]).then(data => data.map((note) => {
    if (!note.description)
      note.description = ''

    return note
  }))
}

export function createLabel(data: CreateLabel) {
  return create('label', data)
}

export function updateLabel(id: number, data: Partial<CreateLabel>) {
  return update('label', id, data)
}

export function removeLabel(id: number) {
  return remove('label', id)
}

export async function selectLabel() {
  const data = await select<Array<Label>>('SELECT * FROM label WHERE deleted_at = 0 ORDER BY id')
  const list = (await Promise.all(data.map(({ id }) => selectLabelTotalTime(id))))
  data.forEach((plan, index) => plan.totalTime = list[index].totalTime)
  return data
}

function selectLabelTotalTime(id: number) {
  return select<Array<Pick<Label, 'totalTime'>>>(`
    SELECT IFNULL(sum(note.end_time - note.start_time), 0) AS total_time
      FROM note,
          note_label
    WHERE note_label.label_id = $1 AND
          note_label.note_id = note.id AND
          note.deleted_at = 0
  `, [id]).then(i => i.pop()!)
}

export function relateNoteAndLabel(noteId: number, labelIdList: Array<number>) {
  return Promise.all(labelIdList.map(labelId => create('note_label', {
    noteId,
    labelId,
  })))
}
