import type { Insertable } from 'kysely'
import { sql } from 'kysely'
import type { Box as TransformBox } from '../transform-types'
import { Model, get, set } from './model'

export class Box extends Model<TransformBox> {
  table = 'box' as const

  transactionInsert(@set value: Insertable<TransformBox>) {
    return this.transaction().execute(async (trx) => {
      const { lastInsertId } = await trx.box.insert(value)
      await trx.box.update(lastInsertId, {
        sort: lastInsertId,
      })
    })
  }

  removeRelation(id: number) {
    return this.transaction().execute(async (trx) => {
      await trx.box.remove(id)
      await trx.moment.removeBy({
        boxId: id,
      })
    })
  }

  batchRemoveRelation(idList: number[]) {
    return this.transaction().execute(trx => Promise.all(idList.map(id => trx.box.removeRelation(id))))
  }

  @get()
  select(value?: { id?: number }) {
    const query = this.selectByLooseType(value)
    return query
      .select([
        'box.id',
        'box.name',
        'box.color',
        'box.sort',
        'box.deletedAt',
        'box.createdAt',
        'box.updatedAt',
        sql<number>`ifnull(count(m.box_id), 0)`.as('itemCount'),
      ])
      .leftJoin('moment as m', join => join.onRef('m.boxId', '=', 'box.id').on('m.deletedAt', '=', 0))
      .groupBy('box.id')
      .orderBy(['box.sort'])
  }
}
