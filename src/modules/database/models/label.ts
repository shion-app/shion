import { sql } from 'kysely'
import type { Label as TransformLabel } from '../transform-types'
import { Model, get } from './model'

export class Label extends Model<TransformLabel> {
  table = 'label' as const

  @get
  select(value?: { id?: number }) {
    const query = this.selectByLooseType(value)
    return query
      .select([
        'label.id',
        'label.name',
        'label.color',
        'label.sort',
        'label.planId',
        'label.deletedAt',
        sql<number>`ifnull(sum(n.end - n.start), 0)`.as('totalTime'),
      ])
      .leftJoin('note as n', join => join.onRef('n.labelId', '=', 'label.id').on('n.deletedAt', '=', 0))
      .groupBy('label.id')
      .orderBy(['label.sort desc', 'label.id'])
  }
}
