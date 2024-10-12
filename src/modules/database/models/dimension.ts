import { type Insertable, type Kysely, sql } from 'kysely'
import type { DB, Dimension as TransformDimension } from '../transform-types'
import { Model, get, set } from './model'
import type { Label } from './label'
import type { Program } from './program'

export enum Code {
  GAME = 'game',
  VIDEO = 'video',
  MUSIC = 'music',
  BROWSER = 'browser',
}

export class Dimension extends Model<TransformDimension> {
  table = 'dimension' as const

  #label: Label
  #program: Program

  constructor(kysely: Kysely<DB>, label: Label, program: Program) {
    super(kysely)
    this.#label = label
    this.#program = program
  }

  transactionInsert(@set value: Insertable<TransformDimension>) {
    return this.transaction().execute(async (trx) => {
      const { lastInsertId } = await trx.dimension.insert(value)
      await trx.dimension.update(lastInsertId, {
        sort: lastInsertId,
      })
    })
  }

  removeRelation(id: number) {
    return this.transaction().execute(async (trx) => {
      await trx.dimension.remove(id)
      await trx.dimensionLabel.removeBy({
        dimensionId: id,
      })
      await trx.dimensionProgram.removeBy({
        dimensionId: id,
      })
    })
  }

  batchRemoveRelation(idList: number[]) {
    return this.transaction().execute(trx => Promise.all(idList.map(id => trx.dimension.removeRelation(id))))
  }

  @get()
  selectByLabel() {
    return this.kysely.with('l', () => this.#label.select())
      .selectFrom(['dimension'])
      .select([
        'dimension.id',
        'dimension.name',
        'dimension.color',
        'dimension.sort',
        'dimension.code',
        'dimension.deletedAt',
        'dimension.createdAt',
        'dimension.updatedAt',
        sql<number>`ifnull(sum(l.total_time), 0)`.as('totalTime'),
      ])
      .leftJoin('dimensionLabel', join =>
        join.onRef('dimension.id', '=', 'dimensionLabel.dimensionId').on('dimensionLabel.deletedAt', '=', 0),
      )
      .leftJoin('l', join =>
        join.onRef('dimensionLabel.labelId', '=', 'l.id').on('l.deletedAt', '=', 0),
      )
      .where('dimension.deletedAt', '=', 0)
      .groupBy('dimension.id')
      .orderBy(['dimension.sort'])
  }

  @get()
  selectByProgram() {
    return this.kysely.with('p', () => this.#program.select())
      .selectFrom(['dimension'])
      .select([
        'dimension.id',
        'dimension.name',
        'dimension.color',
        'dimension.sort',
        'dimension.code',
        'dimension.deletedAt',
        'dimension.createdAt',
        'dimension.updatedAt',
        sql<number>`ifnull(sum(p.total_time), 0)`.as('totalTime'),
      ])
      .leftJoin('dimensionProgram', join =>
        join.onRef('dimension.id', '=', 'dimensionProgram.dimensionId').on('dimensionProgram.deletedAt', '=', 0),
      )
      .leftJoin('p', join =>
        join.onRef('dimensionProgram.programId', '=', 'p.id').on('p.deletedAt', '=', 0),
      )
      .where('dimension.deletedAt', '=', 0)
      .groupBy('dimension.id')
      .orderBy(['dimension.sort'])
  }

  @get()
  select() {
    return this.transaction().execute(async (trx) => {
      const labelList = await trx.dimension.selectByLabel()
      const programList = await trx.dimension.selectByProgram()
      for (let i = 0; i < labelList.length; i++)
        labelList[i].totalTime += programList[i].totalTime

      return labelList
    })
  }

  @get()
  selectAllCode() {
    const query = this.selectByLooseType()
    return query.select(['code'])
  }

  @get()
  selectAvailableCode() {
    return this.transaction().execute(async (trx) => {
      const codeList = (await trx.dimension.selectAllCode()).map(i => i.code)
      return [...Object.values(Code)].map(i => ({
        code: i,
        disabled: codeList.includes(i),
      })).sort(a => a.disabled ? 1 : -1)
    })
  }
}
