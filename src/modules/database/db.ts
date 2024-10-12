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
import camelcaseKeys from 'camelcase-keys'
import { camelCase } from 'camel-case'
import type { Emitter, EventType } from 'mitt'
import mitt from 'mitt'
import type { QueryResult } from 'tauri-plugin-shion-sql-api'
import type Database from 'tauri-plugin-shion-sql-api'

import type { DB } from './transform-types'
import { Program } from './models/program'
import { Activity } from './models/activity'
import { Plan } from './models/plan'
import { Label } from './models/label'
import { Note } from './models/note'
import { Moment } from './models/moment'
import { Overview } from './models/overview'
import { Box } from './models/box'
import { Link } from './models/link'
import { History } from './models/history'
import { Domain } from './models/domain'
import { Remark } from './models/remark'
import { Dimension } from './models/dimension'
import { DimensionLabel } from './models/dimensionLabel'
import { DimensionProgram } from './models/dimensionProgram'

export type { QueryResult } from 'tauri-plugin-shion-sql-api'

type IsSelectQueryBuilder<T> = T extends SelectQueryBuilder<any, any, any> ? true : false
type IsTransactionQueryBuilder<T> = T extends TransactionQueryBuilder<any, any> ? true : false

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
          Promise<
        IsSelectQueryBuilder<ReturnType<T[K]>> extends true
          ? InferResult<ReturnType<ReturnType<T[K]>['compile']>>
          : IsTransactionQueryBuilder<ReturnType<T[K]>> extends true
            ? Awaited<ReturnType<ReturnType<ReturnType<T[K]>['compile']>>>
            : QueryResult
      >
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

function createKyselyDatabase<D, U extends Record<string, object>>(executor: DatabaseExecutor<D>, models: U) {
  class KyselyDatabase<M extends Record<string, object>> {
    protected _executor: DatabaseExecutor<D>
    #emitter: Emitter<Record<EventType, unknown>>

    constructor(executor: DatabaseExecutor<D>, models: M, emitter: Emitter<Record<EventType, unknown>>) {
      this._executor = executor
      this.#emitter = emitter
      for (const modelKey in models) {
        const obj = {
          [modelKey]: new Proxy(models[modelKey], {
            get: (target, p) => {
              if (typeof target[p] === 'function') {
                return this.#provideConnection((...args) => {
                  const fn = target[p]
                  const { __transform } = target.constructor as any
                  const { __setIndex, __getFlag, __needTransform } = fn as any
                  if (__transform && __transform.set && typeof __setIndex == 'number') {
                    if (Array.isArray(args[__setIndex])) {
                      for (let i = 0; i < args[__setIndex].length; i++)
                        Object.assign(args[__setIndex][i], __transform.set(args[__setIndex][i]))
                    }
                    else {
                      Object.assign(args[__setIndex], __transform.set(args[__setIndex]))
                    }
                  }

                  const query = fn.apply(target, args)
                  const CompiledQuery = query.compile()

                  if (query instanceof TransactionQueryBuilder)
                    return this.#transaction(CompiledQuery as any)

                  if (__getFlag) {
                    const result = this._select(CompiledQuery)
                    if (!__needTransform)
                      return result

                    return result.then((result) => {
                      if (__transform)
                        return (result as object[]).map(i => transformResult(target.constructor as any, i))

                      else
                        return result
                    }).then(result => camelcaseKeys(result, {
                      deep: true,
                    }))
                  }

                  return this._execute(CompiledQuery)
                }, () => {
                  if (typeof p == 'string')
                    this.#emitter.emit(`${modelKey}.${p}`)
                })
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

    #provideConnection(consumer: (...args) => Promise<unknown>, cb: Function) {
      return async (...args) => {
        const result = await consumer(...args)
        cb()
        return result
      }
    }

    protected async _execute<T extends CompiledQuery>(query: T) {
      try {
        return await this._executor.execute(query.sql, query.parameters as unknown[])
      }
      catch (error) {
        throw this._executor.handleError(error)
      }
    }

    async execute(sql: string) {
      try {
        return await this._executor.execute(sql)
      }
      catch (error) {
        throw this._executor.handleError(error)
      }
    }

    protected async _select<T extends CompiledQuery>(query: T) {
      try {
        return await this._executor.select<InferResult<T>>(query.sql, query.parameters as unknown[])
      }
      catch (error) {
        throw this._executor.handleError(error)
      }
    }

    async #transaction(callback: (trx) => Promise<unknown>) {
      const transaction = new Transaction(this._executor, models, this.#emitter)
      return await this._executor.transaction(() => callback(transaction))
    }

    close() {
      return this._executor.close()
    }

    load() {
      return this._executor.load()
    }

    on(key: string, cb: Function) {
      this.#emitter.on(key, () => cb())
    }

    off(key: string) {
      this.#emitter.off(key)
    }
  }

  class Transaction extends KyselyDatabase<Record<string, object>> {
    async _execute<T extends CompiledQuery>(query: T) {
      try {
        return await this._executor.executeTransaction(query.sql, query.parameters as unknown[])
      }
      catch (error) {
        throw this._executor.handleError(error)
      }
    }

    async _select<T extends CompiledQuery>(query: T) {
      try {
        return await this._executor.selectTransaction<InferResult<T>>(query.sql, query.parameters as unknown[])
      }
      catch (error) {
        throw this._executor.handleError(error)
      }
    }
  }

  return new KyselyDatabase(executor, models, mitt()) as KyselyDatabase<U> & Executor<U>
}

export class TransactionBuilder<T> {
  execute<U>(callback: (trx: T) => Promise<U>) {
    return new TransactionQueryBuilder<T, U>(callback)
  }
}

export class TransactionQueryBuilder<T, U> {
  constructor(private callback: (trx: T) => Promise<U>) { }

  compile() {
    return this.callback
  }
}

const program = new Program(kysely)
const activity = new Activity(kysely, program)
const plan = new Plan(kysely)
const label = new Label(kysely)
const note = new Note(kysely, label, plan)
const box = new Box(kysely)
const moment = new Moment(kysely, box)
const overview = new Overview(kysely)
const link = new Link(kysely)
const domain = new Domain(kysely)
const history = new History(kysely, domain)
const remark = new Remark(kysely, program)
const dimension = new Dimension(kysely, label, program)
const dimensionLabel = new DimensionLabel(kysely)
const dimensionProgram = new DimensionProgram(kysely)
const models = {
  program,
  activity,
  plan,
  label,
  note,
  moment,
  overview,
  box,
  link,
  domain,
  history,
  remark,
  dimension,
  dimensionLabel,
  dimensionProgram,
}

export type Models = typeof models

export type Executor<U = typeof models> = { [K in keyof U]: Transform<U[K]> }

export function createKyselyDatabaseWithModels<D, T extends DatabaseExecutor<D>>(executor: T) {
  return createKyselyDatabase(executor, models)
}

export enum SqliteErrorEnum {
  RAW = -1,
  SQLITE_CONSTRAINT_UNIQUE = 2067,
}

export class DatabaseError extends Error {
  code: number
  fields: string[]

  constructor(message: string, code: number, fields: string[]) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.fields = fields
  }
}

export type DatabaseExecutor<T> = Pick<Database, 'execute' | 'select' | 'close' | 'executeTransaction' | 'selectTransaction'> & {
  database: T
  handleError(err: unknown): DatabaseError
  load(): Promise<void>
  transaction(cb: () => Promise<unknown>): Promise<unknown>
}

export function findSqliteMessageFields(message: string) {
  const regex = /[a-zA-Z0-9]+\.([a-zA-Z0-9_]+)/g
  let match: RegExpExecArray | null
  const fields: string[] = []
  match = regex.exec(message)
  while (match !== null) {
    fields.push(match[1])
    match = regex.exec(message)
  }
  return fields.map(v => camelCase(v))
}
