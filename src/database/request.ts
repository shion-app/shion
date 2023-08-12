import Database from 'tauri-plugin-sql-api'
import { snakeCase } from 'snake-case'
import { camelCase } from 'camel-case'
import { error } from 'tauri-plugin-log-api'

import { i18n } from '@locales/index'
import type { Activity, Label, Note, Plan, Program, RecentNote, SyncLog, TableName } from '@interfaces/index'
import { startOfDay, subDays } from 'date-fns'

const PATH = `sqlite:data${import.meta.env.TAURI_DEBUG ? '-dev' : ''}.db`

const enum SqliteError {
  UNHANDLED = -1,
  SQLITE_CONSTRAINT_UNIQUE = 2067,
}

function parseError(e) {
  const match = /\(code: (\d+)\)/.exec(e)!
  const code = +match[1]
  const message = parseMessage(code, e)
  error(e)
  return message
}

function parseMessage(code: SqliteError, error: string) {
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
        error,
      })
  }
}

const db = await Database.load(PATH)

type CreateNote = Pick<Note, 'startTime' | 'endTime' | 'planId' | 'labelId'> & Partial<Pick<Note, 'description'>>

type CreatePlan = Pick<Plan, 'name' | 'color'>

type CreateLabel = Pick<Label, 'name' | 'planId' | 'color'>

type CreateProgram = Pick<Program, 'description' | 'path' | 'icon' | 'color'>

type CreateActivity = Pick<Activity, 'startTime' | 'endTime' | 'programId'>

export async function execute(query: string, bindValues?: unknown[]) {
  try {
    return await db.execute(query, bindValues)
  }
  catch (error) {
    throw parseError(error)
  }
}

export async function create(table: TableName, data: Record<string, unknown>) {
  const key = Object.keys(data).map(key => snakeCase(key)).join(', ')
  const placeholder = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')
  const value = Object.values(data)
  return execute(`INSERT INTO ${table} (${key}) VALUES (${placeholder})`, value)
}

export async function update(table: TableName, id: number, data: Record<string, unknown>) {
  const placeholder = Object.entries(data).map(([k], i) => `${snakeCase(k)} = $${i + 1}`).join(', ')
  const value = Object.values(data)
  return execute(`UPDATE ${table} SET ${placeholder} WHERE id = ${id}`, value)
}

function remove(table: TableName, id: number) {
  return db.execute(`UPDATE ${table} SET deleted_at = ${new Date().getTime()} WHERE id = ${id}`)
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

export async function removePlan(id: number) {
  await remove('plan', id)
  await execute(`UPDATE label SET deleted_at = ${new Date().getTime()} WHERE plan_id = ${id}`)
  await execute(`UPDATE note SET deleted_at = ${new Date().getTime()} WHERE plan_id = ${id}`)
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

export async function selectNoteByPlanId(id: number, start: number, end: number) {
  const noteList = await select<Array<Note>>(`
    SELECT id, start_time, end_time, description, plan_id, label_id
      FROM note
    WHERE start_time > $1 AND
      start_time < $2 AND
      plan_id = ${id} AND
      deleted_at = 0
    ORDER BY start_time`, [start, end])
  const labelList = (await Promise.all(noteList.map(({ labelId }) => selectLabelById(labelId))))
  noteList.forEach((note, index) => note.label = labelList[index]!)
  return noteList
}

export async function selectNoteByLabelId(id: number, start: number, end: number) {
  const noteList = await select<Array<Note>>(`
    SELECT id, start_time, end_time, description, plan_id, label_id
      FROM note
    WHERE start_time > $1 AND
      start_time < $2 AND
      label_id = ${id} AND
      deleted_at = 0
    ORDER BY start_time`, [start, end])
  const labelList = (await Promise.all(noteList.map(({ labelId }) => selectLabelById(labelId))))
  noteList.forEach((note, index) => note.label = labelList[index]!)
  return noteList
}

export function selectRecentNote(range: number) {
  return select<Array<RecentNote>>(`
    SELECT note.plan_id,
        note.label_id,
        sum(note.end_time - note.start_time) AS total_time,
        date(note.start_time / 1000, 'unixepoch') AS date,
        [plan].name AS plan_name,
        label.name AS label_name,
        [plan].color AS plan_color,
        label.color AS label_color
    FROM note,
        [plan],
        label
    WHERE note.deleted_at = 0 AND
          note.plan_id = [plan].id AND
          note.label_id = label.id AND
          note.start_time >= ${startOfDay(subDays(new Date(), range - 1)).getTime()} AND
          note.start_time <= ${new Date().getTime()}
    GROUP BY note.plan_id,
              note.label_id,
              date(note.start_time / 1000, 'unixepoch')
    ORDER BY note.start_time DESC;`)
}

export function createLabel(data: CreateLabel) {
  return create('label', data)
}

export function updateLabel(id: number, data: Partial<CreateLabel>) {
  return update('label', id, data)
}

export async function removeLabel(id: number) {
  await remove('label', id)
  await execute(`UPDATE note SET deleted_at = ${new Date().getTime()} WHERE label_id = ${id}`)
}

export async function selectLabel() {
  const data = await select<Array<Label>>('SELECT * FROM label WHERE deleted_at = 0 ORDER BY plan_id, id')
  const list = (await Promise.all(data.map(({ id }) => selectLabelTotalTime(id))))
  data.forEach((plan, index) => plan.totalTime = list[index].totalTime)
  return data
}

async function selectLabelById(id: number) {
  const label = (await select<Array<Label>>(`SELECT * FROM label WHERE deleted_at = 0 AND id = ${id} ORDER BY id`)).pop()
  if (label)
    label.totalTime = 0

  return label
}

function selectLabelTotalTime(id: number) {
  return select<Array<Pick<Label, 'totalTime'>>>(`
    SELECT IFNULL(sum(end_time - start_time), 0) AS total_time
      FROM note
    WHERE label_id = ${id} AND
      deleted_at = 0
  `).then(i => i.pop()!)
}

export function getLastSyncId() {
  return select<Array<Pick<SyncLog, 'id'>>>(`
    SELECT MAX(id) AS id
      FROM sync_log
    WHERE id IN (
      SELECT id
        FROM sync_log
      WHERE sync = 1
    )`).then(i => i.pop()?.id || 0)
}

export function selectUnsyncLog() {
  return select<Array<SyncLog>>('SELECT * FROM sync_log WHERE sync = 0 ORDER BY id')
}

export function setLogSync() {
  return execute('UPDATE sync_log SET sync = 1 WHERE sync = 0')
}

export function resetTableAutoIncrementId(tableName: string) {
  return execute(`DELETE FROM sqlite_sequence WHERE name = "${tableName}"`)
}

export function createProgram(data: CreateProgram) {
  return create('program', {
    ...data,
    icon: data.icon.join(', '),
  })
}

export async function removeProgram(id: number) {
  await remove('program', id)
  await execute(`UPDATE activity SET deleted_at = ${new Date().getTime()} WHERE program_id = ${id}`)
}

export function selectProgram() {
  return select<Array<Omit<Program, 'icon'> & {
    icon: string
  }>>('SELECT * FROM program WHERE deleted_at = 0 ORDER BY id').then(list => list.map((i) => {
    return {
      ...i,
      icon: i.icon.split(',').map(Number),
    }
  }))
}

export function createActivity(data: CreateActivity) {
  return create('activity', data)
}

export function updateActivity(id: number, data: Partial<CreateActivity>) {
  return update('activity', id, data)
}
