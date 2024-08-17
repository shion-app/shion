import { type Kysely } from 'kysely'
import { jsonBuildObject } from 'kysely/helpers/sqlite'

import type { DB, Remark as TransformRemark } from '../transform-types'
import { Model, get, injectModel } from './model'
import { Program } from './program'

@injectModel({
  relation: {
    program: Program,
  },
})
export class Remark extends Model<TransformRemark> {
  table = 'remark' as const

  #program: Program

  constructor(kysely: Kysely<DB>, program: Program) {
    super(kysely)
    this.#program = program
  }

  @get()
  select(value?: { start?: number; end?: number; programId?: number }) {
    let query = this.kysely.with('p', () => this.#program.select()).selectFrom(['remark', 'p']).where('remark.deletedAt', '=', 0)
    if (value?.start)
      query = query.where('time', '>', value.start)
    if (value?.end)
      query = query.where('time', '<', value.end)
    if (value?.programId)
      query = query.where('programId', '=', value.programId)

    return query.select(eb =>
      jsonBuildObject({
        id: eb.ref('p.id'),
        color: eb.ref('p.color'),
        icon: eb.ref('p.icon'),
        name: eb.ref('p.name'),
        path: eb.ref('p.path'),
        sort: eb.ref('p.sort'),
        deletedAt: eb.ref('p.deletedAt'),
        createdAt: eb.ref('p.createdAt'),
        updatedAt: eb.ref('p.updatedAt'),
        totalTime: eb.ref('p.totalTime'),
      }).as('program'),
    ).selectAll(this.table).whereRef('remark.programId', '=', 'p.id')
  }
}
