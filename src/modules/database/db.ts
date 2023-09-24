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
import type { DB } from './types'
import { Program } from './models/program'
import type { Model } from './models/model'

type IsSelectQueryBuilder<T> = T extends SelectQueryBuilder<any, any, any> ? true : false

type IsQueryBuilder<T> = T extends {
  compile(): any
} ? true : false

type Transform<T extends Model> =
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
      : never
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

function createDatabase<U extends Record<string, Model>>(database: Database, models: U) {
  class KyselyDatabase<M extends object> {
    #database: Database
    #models: M

    constructor(database: Database, models: M) {
      this.#models = models
      this.#database = database
      for (const modelKey of Object.keys(models)) {
        const obj = {
          [modelKey]: {},
        }
        Object.assign(this, obj)
        const list = Object.getOwnPropertyNames(Object.getPrototypeOf(models[modelKey])).filter(name => name !== 'constructor')
        for (const fnKey of list) {
          Object.assign(obj[modelKey], {
            [fnKey]: (...args) => {
              const model = this.#models[modelKey] as Model
              const fn = model[fnKey]
              const query = fn.call(model, args).compile()
              if ((fn as any).select)
                return this.#select(query)

              return this.#execute(query)
            },
          })
        }
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

export function select() {
  return (_, __, descriptor) => {
    descriptor.value.select = true
  }
}
