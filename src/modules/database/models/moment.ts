import type { Moment as TransformMoment } from '../transform-types'
import { Model, get } from './model'

export class Moment extends Model<TransformMoment> {
  table = 'moment' as const

  @get
  select(value?: { id?: number }) {
    const query = this.selectByLooseType(value)
    return query.selectAll(this.table).orderBy('createdAt desc')
  }
}
