import type * as db from '../types'
import { Model } from './model'

export class Program extends Model<db.Program> {
  table = 'program' as const
}
