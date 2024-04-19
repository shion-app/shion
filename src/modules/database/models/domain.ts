import { sql } from 'kysely'
import type { Domain as TransformDomain } from '../transform-types'
import { Model, get } from './model'

export class Domain extends Model<TransformDomain> {
  table = 'domain' as const

  @get
  select(value?: { id?: number; pattern?: string }) {
    let query = this.selectByLooseType(value)
    if (value?.pattern)
      query = query.where('pattern', '=', value.pattern)
    return query
      .select([
        'domain.id',
        'domain.name',
        'domain.color',
        'domain.pattern',
        'domain.sort',
        'domain.deletedAt',
        'domain.createdAt',
        'domain.updatedAt',
        sql<number>`ifnull(count(h.domain_id), 0)`.as('itemCount'),
      ])
      .leftJoin('history as h', join => join.onRef('h.domainId', '=', 'domain.id').on('h.deletedAt', '=', 0))
      .groupBy('domain.id')
      .orderBy(['domain.sort'])
  }
}
