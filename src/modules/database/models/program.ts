import type { Program as TransformProgram } from '../transform-types'
import type { Program as OriginProgram } from '../types'
import { Model, injectModel } from './model'

@injectModel<OriginProgram, TransformProgram>({
  set(value) {
    return {
      ...value,
      icon: value.icon.join(','),
    }
  },
  get(entity) {
    return {
      ...entity,
      icon: entity.icon.split(',').map(Number),
    }
  },
})
export class Program extends Model<TransformProgram> {
  table = 'program' as const
}
