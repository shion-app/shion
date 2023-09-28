import { sql } from 'kysely'
import type { Program as TransformProgram } from '../transform-types'
import type { Program as OriginProgram } from '../types'
import { Model, get, injectModel } from './model'

@injectModel<OriginProgram, TransformProgram>({
  set: v => ({
    icon: v.icon.join(','),
  }),
  get: e => ({
    icon: e.icon.split(',').map(Number),
  }),
})
export class Program extends Model<TransformProgram> {
  table = 'program' as const

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
        sql<number>`ifnull(sum(activity.end - activity.start), 0)`.as('totalTime'),
      ])
      .leftJoin('activity', join => join.onRef('activity.programId', '=', 'program.id').on('activity.deletedAt', '=', 0))
      .groupBy('program.id')
      .orderBy(['program.sort desc', 'program.id'])
  }
}
