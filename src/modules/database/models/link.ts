import type { Link as TransformLink } from '../transform-types'
import { Model, get } from './model'

export class Link extends Model<TransformLink> {
  table = 'link' as const

  @get()
  select(value?: { id?: number }) {
    const query = this.selectByLooseType(value)
    return query.selectAll(this.table)
  }
}
