import { sql } from 'kysely'
import type { Plan as TransformPlan } from '../transform-types'
import { Model, get } from './model'

export class Plan extends Model<TransformPlan> {
  table = 'plan' as const

  @get
  select(value?: { id?: number }) {
    const query = this.selectByLooseType(value)
    return query
      .select([
        'plan.id',
        'plan.name',
        'plan.color',
        'plan.sort',
        'plan.deletedAt',
        sql<number>`ifnull(sum(n.end - n.start), 0)`.as('totalTime'),
      ])
      .leftJoin('note as n', join => join.onRef('n.planId', '=', 'plan.id').on('n.deletedAt', '=', 0))
      .groupBy('plan.id')
      .orderBy(['plan.sort desc', 'plan.id'])
  }
}
