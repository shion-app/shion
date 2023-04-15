import Database from 'tauri-plugin-sql-api'
import { snakeCase } from 'snake-case'
import { camelCase } from 'camel-case'

const PATH = `sqlite:data${import.meta.env.DEV ? '-dev' : ''}.db`

const db = await Database.load(PATH)

interface Plan {
  id: number
  name: string
  totalTime: number
}

type CreatePlan = Pick<Plan, 'name'>

interface Note {
  id: number
  startTime: number
  endTime: number
  description: string
  planId: number
}

type CreateNote = Pick<Note, 'startTime' | 'endTime' | 'planId'> & Partial<Pick<Note, 'description'>>

interface Label {
  id: number
  name: string
  totalTime: number
}

type CreateLabel = Pick<Label, 'name'>

type TableName = 'plan' | 'note' | 'label'

function create(table: TableName, data: Record<string, unknown>) {
  const key = Object.keys(data).map(key => snakeCase(key)).join(', ')
  const value = Object.values(data).join(', ')
  return db.execute(`INSERT INTO ${table} (${key}) VALUES ($1)`, [value])
}

function update(table: TableName, id: number, data: Record<string, unknown>) {
  const set = Object.entries(data).map(([k], i) => `${snakeCase(k)} = $${i + 1}`).join(', ')
  const value = Object.values(data)
  return db.execute(`UPDATE ${table} SET ${set} WHERE id = ${id}`, value)
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

// export function selectAll(table: TableName) {
//   return db.select(`SELECT * from ${table} WHERE deleted_at = 0`)
// }

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
  const data = await select<Array<Plan>>('SELECT * FROM plan WHERE deleted_at = 0')
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
      deleted_at = 0`, [start, end]).then(data => data.map((note) => {
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
      note.deleted_at = 0;`, [start, end]).then(data => data.map((note) => {
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
  const data = await select<Array<Label>>('SELECT * FROM label WHERE deleted_at = 0')
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
