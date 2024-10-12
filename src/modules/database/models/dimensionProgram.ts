import type { DimensionProgram as TransformDimensionProgram } from '../transform-types'
import { Model, get } from './model'

export class DimensionProgram extends Model<TransformDimensionProgram> {
  table = 'dimensionProgram' as const

  removeBy(value: { dimensionId?: number; programId?: number }) {
    let query = this.baseRemove()
    if (value?.dimensionId)
      query = query.where('dimensionId', '=', value.dimensionId)
    if (value?.programId)
      query = query.where('programId', '=', value.programId)

    return query
  }

  @get()
  select(value?: { id?: number; dimensionId?: number }) {
    let query = this.selectByLooseType(value)
    if (value?.dimensionId)
      query = query.where('dimensionId', '=', value.dimensionId)
    return query.select([
      'dimensionProgram.id',
      'dimensionProgram.dimensionId',
      'dimensionProgram.programId',
      'dimensionProgram.createdAt',
      'dimensionProgram.updatedAt',
      'dimensionProgram.deletedAt',
    ])
  }
}
