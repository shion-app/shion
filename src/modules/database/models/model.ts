// import type { Insertable, Kysely, SelectQueryBuilder, Selectable, Updateable } from 'kysely'
import type { Insertable, Kysely, Updateable } from 'kysely'
import type { DB } from '../transform-types'

type TableName = keyof DB

type FindKeys<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T]

export class Model<T extends DB[TableName]> {
  protected kysely: Kysely<DB>
  table!: TableName

  constructor(kysely: Kysely<DB>) {
    this.kysely = kysely
  }

  insert(@set value: Insertable<T>) {
    return this.kysely.insertInto(this.table).values(value)
  }

  update(id: number, @set value: Updateable<T>) {
    return this.kysely.updateTable(this.table).set(value).where('id', '=', id)
  }

  remove(id: number) {
    return this.kysely.updateTable(this.table).set({
      deletedAt: Date.now(),
    }).where('id', '=', id)
  }

  @get
  protected selectByLooseType(value?: { id?: number }) {
    let query = this.kysely.selectFrom(this.table).where('deletedAt', '=', 0)
    if (value && value.id)
      query = query.where('id', '=', value.id)

    return query
  }

  @get
  select(value?: { id?: number }) {
    let query = this.kysely.selectFrom(this.table).where('deletedAt', '=', 0)
    if (value && value.id)
      query = query.where('id', '=', value.id)

    return query.selectAll(this.table as FindKeys<DB, T>)
  }
}

export function get(target, propertyKey, descriptor) {
  descriptor.value.__getFlag = true
}

export function set(target, propertyKey, parameterIndex) {
  target[propertyKey].__setIndex = parameterIndex
}

export interface InjectModelOptions<E = any, V = any> {
  set?: (value: V) => Partial<E>
  get?: (entity: E) => Partial<V>
  relation?: object
}

export function injectModel<E, V>(options?: InjectModelOptions<E, V>) {
  return (target) => {
    target.__transform = options
  }
}
