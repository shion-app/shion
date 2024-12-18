import { sql } from 'kysely'
import type { Domain as TransformDomain } from '../transform-types'
import { Model, get } from './model'

export class Domain extends Model<TransformDomain> {
  table = 'domain' as const

  @get()
  select(value?: { id?: number; pattern?: string; start?: number; end?: number; orderByCount?: boolean; limit?: number }) {
    let query = this.selectByLooseType(value)
    if (value?.pattern)
      query = query.where('pattern', '=', value.pattern)
    if (value?.start)
      query = query.where('lastVisited', '>', value.start)
    if (value?.end)
      query = query.where('lastVisited', '<', value.end)
    if (value?.limit)
      query = query.limit(value.limit)
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
      .orderBy(value?.orderByCount ? ['itemCount desc'] : ['domain.sort'])
  }
}
