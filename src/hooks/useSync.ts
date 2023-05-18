import type { SyncLog, TableName } from '@interfaces/index'
import { message } from 'ant-design-vue'

const BASE = 'http://localhost:3000'

const PULL = `${BASE}/sync/pull`

const PUSH = `${BASE}/sync/push`

interface PullResponse {
  data: SyncLog[]
  total: number
}

interface TempSyncLogData {
  _type: 'insert' | 'update' | 'delete'
  _data: Record<string, unknown> & {
    id: number
  }
}

type WrapSyncLog = SyncLog & TempSyncLogData

export function useSync() {
  const { t } = useI18n()

  async function sync() {
    const id = await getLastSyncId()
    const local = (await selectUnsyncLog()).map(wrap)
    const { data, total }: PullResponse = await (await fetch(`${PULL}/${id}`)).json()
    const remote = data.map(wrap)
    await clean(local)
    await writeRemote(remote)
    const reduceLocal = reduce(local)
    await writeLocal(reduceLocal)
    await push(reduceLocal, total)
  }

  async function push(data: WrapSyncLog[], count: number) {
    for (const log of data) {
      // @ts-expect-error delete temp attribute
      delete log._data
      // @ts-expect-error delete temp attribute
      delete log._type
      // @ts-expect-error delete auto increment id
      delete log.id
    }
    const response = await fetch(PUSH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        count,
      }),
    })
    if (!response.ok) {
      const { message: msg } = await response.json()
      message.error(msg as string)
      return
    }
    await setLogSync()
    message.success(t('message.success'))
  }

  function wrap(log: SyncLog) {
    const _data = JSON.parse(log.data)
    if (Object.hasOwn(_data, 'deleted_at') && _data.deleted_at != 0) {
      Object.assign<SyncLog, TempSyncLogData>(log, {
        _type: 'delete',
        _data,
      })
    }
    else {
      Object.assign<SyncLog, TempSyncLogData>(log, {
        _type: log.type,
        _data,
      })
    }
    return log as WrapSyncLog
  }

  async function clean(local: WrapSyncLog[]) {
    const tableOrder: TableName[] = ['note_label', 'label', 'note', 'plan']
    const entityList = local.filter(i => i.type == 'insert').map(i => ({
      id: i._data.id,
      tableName: i.tableName,
    }))
    entityList.sort((a, b) => tableOrder.indexOf(a.tableName) - tableOrder.indexOf(b.tableName))
    for (const { id, tableName } of entityList)
      await execute(`DELETE FROM ${tableName} WHERE id = ${id}`)

    await Promise.all(local.map(({ id }) => execute(`DELETE FROM sync_log WHERE id = ${id}`)))
    const tableList: TableName[] = ['plan', 'label', 'note', 'note_label', 'sync_log']
    await Promise.all(tableList.map(i => resetTableAutoIncrementId(i)))
  }

  function reduce(local: WrapSyncLog[]) {
    const result: WrapSyncLog[] = []
    const temp: WrapSyncLog[] = []
    while (local.length) {
      temp.length = 0
      const current = local.shift()!
      for (let i = local.length - 1; i >= 0; i--) {
        const log = local[i]
        if (log.tableName == current.tableName && log._data.id == current._data.id) {
          temp.unshift(log)
          local.splice(i, 1)
        }
      }
      temp.unshift(current)
      if (temp.length == 1) {
        result.push(...temp)
      }
      else {
        const hasInsert = temp.find(i => i.type == 'insert')
        const last = temp.pop()!
        if (hasInsert) {
          last.type = 'insert'
          last._type = 'insert'
        }

        result.push(last)
      }
    }
    return result
  }

  async function writeRemote(remote: WrapSyncLog[]) {
    await write(remote)
    await setLogSync()
  }

  function writeLocal(local: WrapSyncLog[]) {
    return write(local)
  }

  async function write(log: WrapSyncLog[]) {
    for (const { type, tableName, _data } of log) {
      if (type == 'insert')
        await create(tableName, _data)

      else
        await update(tableName, _data.id, _data)
    }
  }

  return {
    sync,
  }
}
