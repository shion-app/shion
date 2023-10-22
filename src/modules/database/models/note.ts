import { type Kysely } from 'kysely'
import { jsonBuildObject } from 'kysely/helpers/sqlite'

import type { DB, Note as TransformNote } from '../transform-types'
import { Model, get, injectModel } from './model'
import { Label } from './label'
import { Plan } from './plan'

@injectModel({
  relation: {
    label: Label,
    plan: Plan,
  },
})
export class Note extends Model<TransformNote> {
  table = 'note' as const

  #label: Label
  #plan: Plan

  constructor(kysely: Kysely<DB>, label: Label, plan: Plan) {
    super(kysely)
    this.#label = label
    this.#plan = plan
  }

  removeBy(value: { planId?: number; labelId?: number }) {
    let query = this.kysely.updateTable(this.table).set({
      deletedAt: Date.now(),
    })
    if (value.planId)
      query = query.where('planId', '=', value.planId)
    if (value.labelId)
      query = query.where('labelId', '=', value.labelId)

    return query
  }

  @get
  select(value?: { id?: number; start?: number; end?: number; planId?: number; labelId?: number }) {
    let query = this.kysely.with('l', () => this.#label.select()).with('p', () => this.#plan.select()).selectFrom(['note', 'l', 'p']).where('note.deletedAt', '=', 0)
    if (value?.id)
      query = query.where('id', '=', value.id)
    if (value?.start)
      query = query.where('end', '>', value.start)
    if (value?.end)
      query = query.where('start', '<', value.end)
    if (value?.planId)
      query = query.where('note.planId', '=', value.planId)
    if (value?.labelId)
      query = query.where('labelId', '=', value.labelId)

    return query.select(eb => [
      jsonBuildObject({
        id: eb.ref('l.id'),
        name: eb.ref('l.name'),
        color: eb.ref('l.color'),
        sort: eb.ref('l.sort'),
        planId: eb.ref('l.planId'),
        deletedAt: eb.ref('l.deletedAt'),
        totalTime: eb.ref('l.totalTime'),
      }).as('label'),
      jsonBuildObject({
        id: eb.ref('p.id'),
        name: eb.ref('p.name'),
        color: eb.ref('p.color'),
        sort: eb.ref('p.sort'),
        deletedAt: eb.ref('p.deletedAt'),
        totalTime: eb.ref('p.totalTime'),
      }).as('plan'),
    ]).selectAll(this.table).whereRef('note.labelId', '=', 'l.id').whereRef('note.planId', '=', 'p.id')
  }
}
