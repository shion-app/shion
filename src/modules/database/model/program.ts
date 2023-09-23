import type { Insertable, Selectable, Updateable } from 'kysely'
import type { Program } from '../types'
import { kysely } from '../db'

function insert(value: Insertable<Program>) {
  return kysely.insertInto('program').values(value)
}

function update(id: number, value: Updateable<Program>) {
  return kysely.updateTable('program').set(value).where('id', '=', id)
}

function remove(id: number) {
  return update(id, {
    deletedAt: Date.now(),
  })
}

function select(value?: Partial<Pick<Selectable<Program>, 'id'>>) {
  let query = kysely.selectFrom('program')
  if (value && value.id)
    query = query.where('id', '=', value.id)

  return query.selectAll()
}

export const program = {
  insert,
  update,
  remove,
  select,
}
