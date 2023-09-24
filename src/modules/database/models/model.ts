import type { Generated, Insertable, Kysely, Selectable, Updateable } from 'kysely'
import type { } from '../db'
import { select } from '../db'
import type { DB } from '../types'

interface Table {
  id: Generated<number>
  deletedAt: Generated<number>
}

export class Model<T extends Table = Table> {
  #kysely: Kysely<DB>
  table!: keyof DB

  constructor(kysely: Kysely<DB>) {
    this.#kysely = kysely
  }

  insert(value: Insertable<T>) {
    return this.#kysely.insertInto(this.table).values(value)
  }

  update(id: number, value: Updateable<T>) {
    return this.#kysely.updateTable(this.table).set(value).where('id', '=', id)
  }

  remove(id: number) {
    return this.#kysely.updateTable(this.table).set({
      deletedAt: Date.now(),
    }).where('id', '=', id)
  }

  @select()
  select(value?: Partial<Pick<Selectable<Table>, 'id'>>) {
    let query = this.#kysely.selectFrom(this.table)
    if (value && value.id)
      query = query.where('id', '=', value.id)

    return query.selectAll()
  }
}
