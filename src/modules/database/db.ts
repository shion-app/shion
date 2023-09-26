import type {
  CompiledQuery,
  InferResult,
  SelectQueryBuilder,
} from 'kysely'
import {
  CamelCasePlugin,
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely'
import type { QueryResult } from 'tauri-plugin-sql-api'
import Database from 'tauri-plugin-sql-api'
import { camelCase } from 'camel-case'

import { i18n } from '@locales/index'
import type { DB } from './transform-types'
import { Program } from './models/program'

type IsSelectQueryBuilder<T> = T extends SelectQueryBuilder<any, any, any> ? true : false

type IsQueryBuilder<T> = T extends {
  compile(): any
} ? true : false

type Transform<T> =
  {
    [K in keyof T]:
    T[K] extends (...args: any) => any
      ? (...args: Parameters<T[K]>) =>
        IsQueryBuilder<ReturnType<T[K]>> extends true
          ?
          Promise<IsSelectQueryBuilder<ReturnType<T[K]>> extends true
            ? InferResult<ReturnType<ReturnType<T[K]>['compile']>>
            : Promise<QueryResult>>
          : never
      : T[K]
  }

const kysely = new Kysely<DB>({
  dialect: {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: db => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
  plugins: [
    new CamelCasePlugin(),
  ],
})

const enum SqliteError {
  UNHANDLED = -1,
  SQLITE_CONSTRAINT_UNIQUE = 2067,
}

function createDatabase<U extends Record<string, object>>(database: Database, models: U) {
  class KyselyDatabase<M extends Record<string, object>> {
    #database: Database

    constructor(database: Database, models: M) {
      this.#database = database
      for (const modelKey in models) {
        const obj = {
          [modelKey]: new Proxy(models[modelKey], {
            get: (target, p) => {
              if (typeof target[p] === 'function') {
                return (...args) => {
                  const fn = target[p]
                  const { __transform } = target.constructor as any
                  const { __setIndex, __getFlag } = fn as any
                  if (__transform && typeof __setIndex == 'number')
                    args[__setIndex] = __transform.set(args[__setIndex])

                  const query = fn.apply(target, args).compile()
                  if (__getFlag) {
                    return this.#select(query).then((result) => {
                      if (__transform)
                        return (result as unknown[]).map(i => __transform.get(i))

                      else
                        return result
                    })
                  }

                  return this.#execute(query)
                }
              }
              else {
                return target[p]
              }
            },
          }),
        }
        Object.assign(this, obj)
      }
    }

    #parseMessage(code: SqliteError, error: string) {
      switch (code) {
        case SqliteError.SQLITE_CONSTRAINT_UNIQUE: {
          const match = /UNIQUE constraint failed:(.*)/.exec(error)!
          const uniqueKeyList = match[1].split(',').map(i => i.trim().split('.')[1]).filter(i => i != 'deleted_at').map(i => camelCase(i))
          // @ts-expect-error: Type instantiation is excessively deep and possibly infinite.ts(2589)
          return i18n.global.t('error.unique', {
            field: uniqueKeyList.join(', '),
          })
        }
        default:
          return i18n.global.t('error.unhandle', {
            error,
          })
      }
    }

    #parseError(e) {
      const match = /\(code: (\d+)\)/.exec(e)!
      const code = +match[1]
      const message = this.#parseMessage(code, e)
      return message
    }

    async #execute<T extends CompiledQuery>(query: T) {
      try {
        return await this.#database.execute(query.sql, query.parameters as unknown[])
      }
      catch (error) {
        throw this.#parseError(error)
      }
    }

    async #select<T extends CompiledQuery>(query: T) {
      const result = await this.#database.select<InferResult<T>>(query.sql, query.parameters as unknown[])
      return result.map(i => Object.fromEntries(Object.entries(i).map(([key, value]) => [camelCase(key), value]))) as InferResult<T>
    }
  }

  return new KyselyDatabase(database, models) as KyselyDatabase<U> & { [K in keyof U]: Transform<U[K]> }
}

const database = await Database.load('sqlite:data.db')

export const db = createDatabase(database, {
  program: new Program(kysely),
})
