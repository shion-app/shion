import type { Insertable, Kysely, Updateable } from 'kysely'
import type { DB } from '../transform-types'
import type { Executor } from '../db'
import { TransactionBuilder } from '../db'

type TableName = keyof DB

export class Model<T extends DB[TableName]> {
  protected kysely: Kysely<DB>
  table!: TableName

  constructor(kysely: Kysely<DB>) {
    this.kysely = kysely
  }

  protected transaction() {
    return new TransactionBuilder<Executor>()
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
    let query = this.kysely.selectFrom(this.table).where(`${this.table}.deletedAt`, '=', 0)
    if (value?.id)
      query = query.where(`${this.table}.id`, '=', value.id)

    return query
  }
}

export function get(target, propertyKey, descriptor) {
  descriptor.value.__getFlag = true
}

export function set(target, propertyKey, parameterIndex) {
  target[propertyKey].__setIndex = parameterIndex
}

export function injectModel<E, V>(options?: {
  set?: (value: V) => Partial<E>
  get?: (entity: E) => Partial<V>
  relation?: { [K in TableName]?: object }
}) {
  return (target) => {
    target.__transform = options
  }
}
