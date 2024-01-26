import type { Moment as TransformMoment } from '../transform-types'
import { Model, get } from './model'

export class Moment extends Model<TransformMoment> {
  table = 'moment' as const

  removeBy(value: { boxId?: number }) {
    let query = this.baseRemove()
    if (value.boxId)
      query = query.where('boxId', '=', value.boxId)

    return query
  }

  @get
  select(value?: { id?: number; boxId?: number; linkId?: number }) {
    let query = this.selectByLooseType(value)
    if (value?.boxId)
      query = query.where('boxId', '=', value.boxId)
    if (value?.linkId)
      query = query.where('linkId', '=', value.linkId)
    return query.selectAll(this.table).orderBy('createdAt desc')
  }
}
