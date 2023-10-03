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
import type Database from 'tauri-plugin-sql-api'
import { camelCase } from 'camel-case'
import camelcaseKeys from 'camelcase-keys'

import { i18n } from '@locales/index'
import type { DB } from './transform-types'
import { Program } from './models/program'
import { Activity } from './models/activity'
import { Plan } from './models/plan'
import { Label } from './models/label'
import { Note } from './models/note'
export type { QueryResult } from 'tauri-plugin-sql-api'

type IsSelectQueryBuilder<T> = T extends SelectQueryBuilder<any, any, any> ? true : false

type IsQueryBuilder<T> = T extends {
  compile(...args): any
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
            : QueryResult>
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

function transformResult(constructor, obj) {
  const { __transform } = constructor
  if (!__transform)
    return obj
  if (__transform.get)
    Object.assign(obj, __transform.get(obj))

  for (const key in __transform.relation) {
    obj[key] = JSON.parse(obj[key])
    transformResult(__transform.relation[key], obj[key])
  }

  return obj
}

function createKyselyDatabase<U extends Record<string, object>>(database: DatabaseExecutor, models: U) {
  class KyselyDatabase<M extends Record<string, object>> {
    #database: DatabaseExecutor

    constructor(database: DatabaseExecutor, models: M) {
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
                    Object.assign(args[__setIndex], __transform.set(args[__setIndex]))

                  const query = fn.apply(target, args).compile()
                  if (__getFlag) {
                    return this.#select(query).then((result) => {
                      if (__transform)
                        return (result as object[]).map(i => transformResult(target.constructor as any, i))

                      else
                        return result
                    }).then(result => camelcaseKeys(result, {
                      deep: true,
                    }))
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
      if (!match)
        return e as string
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

    #select<T extends CompiledQuery>(query: T) {
      return this.#database.select<InferResult<T>>(query.sql, query.parameters as unknown[])
    }
  }

  return new KyselyDatabase(database, models) as KyselyDatabase<U> & { [K in keyof U]: Transform<U[K]> }
}

const program = new Program(kysely)
const activity = new Activity(kysely, program)
const plan = new Plan(kysely)
const label = new Label(kysely)
const note = new Note(kysely, label, plan)

export function createKyselyDatabaseWithModels(database: DatabaseExecutor) {
  return createKyselyDatabase(database, {
    program,
    activity,
    plan,
    label,
    note,
  })
}

export type DatabaseExecutor = Pick<Database, 'execute' | 'select'>
