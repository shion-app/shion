import type { DimensionLabel as TransformDimensionLabel } from '../transform-types'
import { Model, get } from './model'

export class DimensionLabel extends Model<TransformDimensionLabel> {
  table = 'dimensionLabel' as const

  removeBy(value: { dimensionId?: number; labelId?: number }) {
    let query = this.baseRemove()
    if (value?.dimensionId)
      query = query.where('dimensionId', '=', value.dimensionId)
    if (value?.labelId)
      query = query.where('labelId', '=', value.labelId)

    return query
  }

  @get()
  select(value?: { id?: number; dimensionId?: number }) {
    let query = this.selectByLooseType(value)
    if (value?.dimensionId)
      query = query.where('dimensionId', '=', value.dimensionId)
    return query.select([
      'dimensionLabel.id',
      'dimensionLabel.dimensionId',
      'dimensionLabel.labelId',
      'dimensionLabel.createdAt',
      'dimensionLabel.updatedAt',
      'dimensionLabel.deletedAt',
    ])
  }
}
