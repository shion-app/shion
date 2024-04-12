import type { Kysely } from 'kysely'
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

  @get
  select(value?: { id?: number; boxId?: number; linkId?: number; start?: number; end?: number }) {
    let query = this.kysely.with('b', () => this.#box.select()).selectFrom(['moment', 'b']).where('moment.deletedAt', '=', 0)
    if (value?.boxId)
      query = query.where('boxId', '=', value.boxId)
    if (value?.linkId)
      query = query.where('linkId', '=', value.linkId)
    if (value?.start)
      query = query.where('moment.createdAt', '>', value.start)
    if (value?.end)
      query = query.where('moment.createdAt', '<', value.end)
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
}
