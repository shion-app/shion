import { sql } from 'kysely'
import type { Program as PluginProgram } from 'tauri-plugin-shion-watcher-api'

import type { Program as TransformProgram } from '../transform-types'
import { Model, get, set } from './model'
import { upload } from '@/modules/upload'

export class Program extends Model<TransformProgram> {
  table = 'program' as const

  transactionInsert(@set value: PluginProgram) {
    return this.transaction().execute(async (trx) => {
      const { name, path, icon } = value
      const color = randomColor()
      const { lastInsertId } = await trx.program.insert({
        name,
        path,
        icon: '',
        color,
        platform: PLATFORM,
      })
      const asset = await upload(`${name}.png`, new Uint8Array(icon))
      await trx.program.update(lastInsertId, {
        sort: lastInsertId,
        icon: asset,
      })
    })
  }

  removeRelation(id: number) {
    return this.transaction().execute(async (trx) => {
      await trx.program.remove(id)
      await trx.activity.removeBy({
        programId: id,
      })
    })
  }

  batchRemoveRelation(idList: number[]) {
    return this.transaction().execute(trx => Promise.all(idList.map(id => trx.program.removeRelation(id))))
  }

  @get()
  select(value?: { id?: number; start?: number; end?: number; orderByTotalTime?: boolean; limit?: number; onlyTotalTime?: boolean }) {
    let query = this.selectByLooseType(value)
    if (value?.start)
      query = query.where('end', '>', value.start)
    if (value?.end)
      query = query.where('start', '<', value.end)
    if (value?.limit)
      query = query.limit(value.limit)
    const totalTime = sql<number>`ifnull(sum(a.end - a.start), 0)`.as('totalTime')

    return query
      .select(
        value?.onlyTotalTime
          ? [
              totalTime,

            ]
          : [
              'program.id',
              'program.color',
              'program.icon',
              'program.name',
              'program.path',
              'program.sort',
              'program.platform',
              'program.deletedAt',
              'program.createdAt',
              'program.updatedAt',
              totalTime,
            ])
      .leftJoin('activity as a', join => join.onRef('a.programId', '=', 'program.id').on('a.deletedAt', '=', 0))
      .groupBy('program.id')
      .orderBy(value?.orderByTotalTime ? ['totalTime desc'] : ['program.sort'])
  }

  @get()
  selectDimension(value?: { id?: number }) {
    const query = this.selectByLooseType(value)
    return query
      .select([
        'program.id as programId',
        'dimension.id as dimensionId',
        'dimension.name',
        'dimension.color',
      ])
      .innerJoin('dimensionProgram', join =>
        join.onRef('program.id', '=', 'dimensionProgram.programId').on('dimensionProgram.deletedAt', '=', 0),
      )
      .innerJoin('dimension', join =>
        join.onRef('dimensionProgram.dimensionId', '=', 'dimension.id').on('dimension.deletedAt', '=', 0),
      )
      .orderBy(['program.sort'])
  }
}
