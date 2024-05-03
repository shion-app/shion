import { type Kysely, sql } from 'kysely'
import { jsonBuildObject } from 'kysely/helpers/sqlite'

import type { DB, Moment as TransformMoment } from '../transform-types'
import { Model, get, injectModel } from './model'
import { Box } from './box'

@injectModel({
  relation: {
    box: Box,
  },
})
export class Moment extends Model<TransformMoment> {
  table = 'moment' as const

  #box: Box

  constructor(kysely: Kysely<DB>, box: Box) {
    super(kysely)
    this.#box = box
  }

  removeBy(value: { boxId?: number }) {
    let query = this.baseRemove()
    if (value.boxId)
      query = query.where('boxId', '=', value.boxId)

    return query
  }

  @get()
  select(value?: { id?: number; boxId?: number; linkId?: number; start?: number; end?: number; keyword?: string; page?: number; size?: number }) {
    let query = this.kysely.with('b', () => this.#box.select()).selectFrom(['moment', 'b']).where('moment.deletedAt', '=', 0)
    if (value?.boxId)
      query = query.where('boxId', '=', value.boxId)
    if (value?.linkId)
      query = query.where('linkId', '=', value.linkId)
    if (value?.start)
      query = query.where('moment.createdAt', '>', value.start)
    if (value?.end)
      query = query.where('moment.createdAt', '<', value.end)
    if (value?.keyword) {
      query = query.where(eb => eb.or([
        eb('moment.title', 'like', `%${value.keyword}%`),
        eb('moment.content', 'like', `%${value.keyword}%`),
      ])).orderBy('moment.createdAt desc')
    }
    if (value?.page && value?.size)
      query = query.offset((value.page - 1) * value.size).limit(value.size)
    return query.select(eb =>
      jsonBuildObject({
        id: eb.ref('b.id'),
        name: eb.ref('b.name'),
        color: eb.ref('b.color'),
        sort: eb.ref('b.sort'),
        deletedAt: eb.ref('b.deletedAt'),
        createdAt: eb.ref('b.createdAt'),
        updatedAt: eb.ref('b.updatedAt'),
        itemCount: eb.ref('b.itemCount'),
      }).as('box'),
    ).selectAll(this.table).whereRef('moment.boxId', '=', 'b.id').orderBy('moment.createdAt desc')
  }

  @get(false)
  count(value?: { keyword?: string }) {
    let query = this.selectByLooseType()
    if (value?.keyword) {
      query = query.where(eb => eb.or([
        eb('moment.title', 'like', `%${value.keyword}%`),
        eb('moment.content', 'like', `%${value.keyword}%`),
      ]))
    }
    return query.select(sql<number>`ifnull(count(*), 0)`.as('count'))
  }

  paginationSelect(value: { keyword?: string; page: number; size: number }) {
    const { page, size } = value
    return this.transaction().execute(async (trx) => {
      const [{ count }] = await trx.moment.count(value)
      const list = await trx.moment.select(value)
      return {
        list,
        next: count > page * size,
        count,
      }
    })
  }
}
