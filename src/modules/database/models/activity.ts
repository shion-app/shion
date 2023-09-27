import { jsonObjectFrom } from 'kysely/helpers/sqlite'

import type { Kysely } from 'kysely'
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

  program: Program

  constructor(kysely: Kysely<DB>, program: Program) {
    super(kysely)
    this.program = program
  }

  @get
  select(value?: { id?: number }) {
    return super.select(value).select(
      [
        jsonObjectFrom(
          this.program.select().whereRef('activity.programId', '=', 'program.id'),
        ).as('program'),
      ],
    )
  }
}
