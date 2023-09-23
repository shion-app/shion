import type {
  CompiledQuery,
  InferResult,
} from 'kysely'
import {
  CamelCasePlugin,
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely'
import Database from 'tauri-plugin-sql-api'
import { camelCase } from 'camel-case'

import { i18n } from '@locales/index'
import type { DB } from './types'
import { program } from './model/program'

export const kysely = new Kysely<DB>({
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

interface Builder<T> {
  compile(): CompiledQuery<T>
}

const enum SqliteError {
  UNHANDLED = -1,
  SQLITE_CONSTRAINT_UNIQUE = 2067,
}

class KyselyDatabase<M> {
  #database: Database
  #model: M

  constructor(database: Database, model: M) {
    this.#model = model
    this.#database = database
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

  execute<T>(cb: (model: M) => Builder<T>) {
    return this.#execute(cb(this.#model).compile())
  }

  async #select<T extends CompiledQuery>(query: T) {
    const result = await this.#database.select<InferResult<T>>(query.sql, query.parameters as unknown[])
    return result.map(i => Object.fromEntries(Object.entries(i).map(([key, value]) => [camelCase(key), value]))) as InferResult<T>
  }

  select<T>(cb: (model: M) => Builder<T>) {
    return this.#select(cb(this.#model).compile())
  }
}

const database = await Database.load('sqlite:data.db')

export const db = new KyselyDatabase(database, {
  program,
})
