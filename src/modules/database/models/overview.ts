import type { Overview as TransformOverview } from '../transform-types'
import type { Overview as OriginOverview } from '../types'
import { Model, get, injectModel } from './model'

export enum WidgetType {
  ACTIVE_STATUS_CALENDAR,
  SINGLE_CATEGORY_BAR,
  TEXT_SUMMARY,
}

@injectModel<OriginOverview, TransformOverview>({
  set: v => ({ data: JSON.stringify(v.data) }),
  get: e => ({ data: JSON.parse(e.data) }),
})
export class Overview extends Model<TransformOverview> {
  table = 'overview' as const

  @get
  select(value?: { id?: number }) {
    const query = this.selectByLooseType(value)
    return query.selectAll(this.table)
  }
}
