import type { Insertable, Kysely } from 'kysely'
import { jsonBuildObject } from 'kysely/helpers/sqlite'
import psl from 'psl'

import type { DB, History as TransformHistory } from '../transform-types'
import { Model, get, injectModel, set } from './model'
import { Domain } from './domain'

@injectModel({
  relation: {
    domain: Domain,
  },
})
export class History extends Model<TransformHistory> {
  table = 'history' as const

  #domain: Domain

  constructor(kysely: Kysely<DB>, domain: Domain) {
    super(kysely)
    this.#domain = domain
  }

  batchInsert(@set value: Array<Omit<Insertable<TransformHistory>, 'domainId'>>) {
    return this.transaction().execute(async (trx) => {
      for (const item of value) {
        const pattern = psl.get(new URL(item.url).hostname)
        if (!pattern)
          continue

        const domain = (await trx.domain.select({
          pattern,
        })).pop()

        let domainId = 0
        if (domain) {
          domainId = domain.id
        }
        else {
          const { lastInsertId } = await trx.domain.insert({
            name: pattern,
            color: randomColor(),
            pattern,
          })
          await trx.domain.update(lastInsertId, {
            sort: lastInsertId,
          })
          domainId = lastInsertId
        }

        const { title, url, lastVisited } = item

        await trx.history.insert({
          title,
          url,
          lastVisited,
          domainId,
        })
      }
    })
  }

  @get
  select(value?: { id?: number; domainId?: number; start?: number; end?: number }) {
    let query = this.kysely.with('d', () => this.#domain.select()).selectFrom(['history', 'd']).where('history.deletedAt', '=', 0)
    if (value?.domainId)
      query = query.where('domainId', '=', value.domainId)
    if (value?.start)
      query = query.where('history.lastVisited', '>', value.start)
    if (value?.end)
      query = query.where('history.lastVisited', '<', value.end)
    return query.select(eb =>
      jsonBuildObject({
        id: eb.ref('d.id'),
        name: eb.ref('d.name'),
        color: eb.ref('d.color'),
        pattern: eb.ref('d.pattern'),
        sort: eb.ref('d.sort'),
        deletedAt: eb.ref('d.deletedAt'),
        createdAt: eb.ref('d.createdAt'),
        updatedAt: eb.ref('d.updatedAt'),
        itemCount: eb.ref('d.itemCount'),
      }).as('domain'),
    ).selectAll(this.table).whereRef('history.domainId', '=', 'd.id')
  }
}
