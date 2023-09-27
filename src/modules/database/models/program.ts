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
    return query.select(['id', 'color', 'deletedAt', 'icon', 'name', 'path', 'totalTime', 'sort'])
  }
}
