import type { Insertable } from 'kysely'
import { sql } from 'kysely'
import type { Plan as TransformPlan } from '../transform-types'
import { Model, get, set } from './model'

export class Plan extends Model<TransformPlan> {
  table = 'plan' as const

  transactionInsert(@set value: Insertable<TransformPlan>) {
    return this.transaction().execute(async (trx) => {
      const { lastInsertId } = await trx.plan.insert(value)
      await trx.plan.update(lastInsertId, {
        sort: lastInsertId,
      })
    })
  }

  removeRelation(id: number) {
    return this.transaction().execute(async (trx) => {
      await trx.plan.remove(id)
      await trx.label.removeBy({
        planId: id,
      })
      await trx.note.removeBy({
        planId: id,
      })
    })
  }

  setHidden(list: Array<{ id: number; hidden: number }>) {
    return this.transaction().execute(async (trx) => {
      for (const { id, hidden } of list) {
        await trx.plan.update(id, { hidden })
        const labelList = (await trx.label.select({ planId: id })).map(({ id }) => ({ id, hidden }))
        for (const { id, hidden } of labelList)
          await trx.label.update(id, { hidden })
      }
    })
  }

  batchRemoveRelation(idList: number[]) {
    return this.transaction().execute(trx => Promise.all(idList.map(id => trx.plan.removeRelation(id))))
  }

  @get()
  select(value?: { id?: number; start?: number; end?: number; orderByTotalTime?: boolean; limit?: number; onlyTotalTime?: boolean; hidden?: boolean }) {
    let query = this.selectByLooseType(value)
    if (value?.start)
      query = query.where('end', '>', value.start)
    if (value?.end)
      query = query.where('start', '<', value.end)
    if (typeof value?.hidden === 'boolean')
      query = query.where('hidden', '=', value?.hidden ? 1 : 0)
    if (value?.limit)
      query = query.limit(value.limit)
    const totalTime = sql<number>`ifnull(sum(n.end - n.start), 0)`.as('totalTime')

    return query
      .select(
        value?.onlyTotalTime
          ? [
              totalTime,
            ]
          : [
              'plan.id',
              'plan.name',
              'plan.color',
              'plan.sort',
              'plan.hidden',
              'plan.deletedAt',
              'plan.createdAt',
              'plan.updatedAt',
              totalTime,
            ])
      .leftJoin('note as n', join => join.onRef('n.planId', '=', 'plan.id').on('n.deletedAt', '=', 0))
      .groupBy('plan.id')
      .orderBy(value?.orderByTotalTime ? ['totalTime desc'] : ['plan.sort'])
  }
}
