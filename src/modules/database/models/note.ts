import { type Kysely } from 'kysely'

import { jsonObjectFrom } from 'kysely/helpers/sqlite'
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

  label: Label
  plan: Plan

  constructor(kysely: Kysely<DB>, label: Label, plan: Plan) {
    super(kysely)
    this.label = label
    this.plan = plan
  }

  @get
  select(value?: { id?: number; start?: number; end?: number; planId?: number; labelId?: number }) {
    let query = this.selectByLooseType(value)
    if (value?.start)
      query = query.where('end', '>', value.start)
    if (value?.end)
      query = query.where('start', '<', value.end)
    if (value?.planId)
      query = query.where('planId', '=', value.planId)
    if (value?.labelId)
      query = query.where('labelId', '=', value.labelId)

    return query.select(
      [
        jsonObjectFrom(
          this.label.select().whereRef('note.labelId', '=', 'label.id'),
        ).as('label'),
        jsonObjectFrom(
          this.plan.select().whereRef('note.planId', '=', 'plan.id'),
        ).as('plan'),
      ],
    ).selectAll(this.table)
  }
}
