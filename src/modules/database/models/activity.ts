import { type Kysely } from 'kysely'
import { jsonBuildObject } from 'kysely/helpers/sqlite'

import type { DB, Activity as TransformActivity } from '../transform-types'
import { Model, get, injectModel } from './model'
import { Program } from './program'

@injectModel({
  relation: {
    program: Program,
  },
})
export class Activity extends Model<TransformActivity> {
  table = 'activity' as const

  #program: Program

  constructor(kysely: Kysely<DB>, program: Program) {
    super(kysely)
    this.#program = program
  }

  removeBy(value: { programId?: number }) {
    let query = this.baseRemove()
    if (value.programId)
      query = query.where('programId', '=', value.programId)

    return query
  }

  @get()
  select(value?: { id?: number; start?: number; end?: number; programId?: number; programIdList?: number[] }) {
    let query = this.kysely.with('p', () => this.#program.select()).selectFrom(['activity', 'p']).where('activity.deletedAt', '=', 0)
    if (value?.id)
      query = query.where('id', '=', value.id)
    if (value?.start)
      query = query.where('end', '>', value.start)
    if (value?.end)
      query = query.where('start', '<', value.end)
    if (value?.programId)
      query = query.where('programId', '=', value.programId)
    if (value?.programIdList)
      query = query.where('programId', 'in', value.programIdList)

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
    ).selectAll(this.table).whereRef('activity.programId', '=', 'p.id')
  }
}
