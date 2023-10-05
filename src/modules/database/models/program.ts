import { sql } from 'kysely'

import type { Program as TransformProgram } from '../transform-types'
import type { Program as OriginProgram } from '../types'
import { Model, get, injectModel } from './model'

@injectModel<OriginProgram, TransformProgram>({
  set: v => ({
    icon: v.icon?.join(','),
  }),
  get: e => ({
    icon: e.icon.split(',').map(Number),
  }),
})
export class Program extends Model<TransformProgram> {
  table = 'program' as const

  removeRelation(id: number) {
    return this.transaction().execute(async (trx) => {
      await trx.program.remove(id)
      await trx.activity.removeBy({
        programId: id,
      })
    })
  }

  @get
  select(value?: { id?: number }) {
    const query = this.selectByLooseType(value)
    return query
      .select([
        'program.id',
        'program.color',
        'program.icon',
        'program.name',
        'program.path',
        'program.sort',
        'program.deletedAt',
        sql<number>`ifnull(sum(a.end - a.start), 0)`.as('totalTime'),
      ])
      .leftJoin('activity as a', join => join.onRef('a.programId', '=', 'program.id').on('a.deletedAt', '=', 0))
      .groupBy('program.id')
      .orderBy(['program.sort desc', 'program.id'])
  }
}
