import { getProgramByPath, onStatusChanged, resume, suspend } from 'tauri-plugin-shion-watcher-api'
import { debug } from '@tauri-apps/plugin-log'
import { format } from 'date-fns'

import type { SelectProgram } from '@/modules/database'
import { db } from '@/modules/database'

const MIN_TIME_SLICE = calcDuration(10, 'second')
const RECORD_TIMER_INTERVAL = calcDuration(60, 'second')
const LOG_TIMER_INTERVAL = calcDuration(65, 'second')

interface Activity {
  path: string
  start: number
  end: number
  active: boolean
  id?: number
}

class Watcher {
  pool: Activity[] = []

  activate(path: string, start: number) {
    this.pool.push({
      path,
      start,
      end: start,
      active: true,
    })
  }

  inactivate(path: string, end: number) {
    const activity = this.#search(path)
    if (activity) {
      activity.active = false
      activity.end = end
    }
  }

  #search(path: string) {
    return this.pool.find(i => i.active && i.path == path)
  }

  async #insert(activity: Activity, program: SelectProgram) {
    const { start, end, active } = activity
    if (!active && end - start < MIN_TIME_SLICE)
      return

    const { lastInsertId } = await db.activity.insert({
      programId: program.id,
      start,
      end,
    })
    activity.id = lastInsertId
    debug(`add activity: ${program.path}`)
  }

  async #update(activity: Activity) {
    if (activity.active)
      activity.end = Date.now()

    await db.activity.update(activity.id!, {
      end: activity.end,
    })
    debug(`update activity: ${activity.path}`)
  }

  async record(list: Array<SelectProgram>) {
    for (const activity of this.pool) {
      const program = list.find(i => i.path == activity.path)
      if (!program)
        continue

      if (typeof activity.id == 'number')
        await this.#update(activity)

      else
        await this.#insert(activity, program)
    }
    this.pool = this.pool.filter(i => i.active)
  }

  async clear(list: Array<SelectProgram>) {
    await this.record(list)
    this.pool = []
  }

  log() {
    debug('------------activity status-------------')
    for (const { path, active, start, end } of this.pool)
      debug(`start: ${format(start, 'HH:mm:ss')}, end: ${format(end, 'HH:mm:ss')}, path: ${path}, active: ${active}`)
    debug('----------------------------------------')
  }
}

export const useActivityStore = defineStore('activity', () => {
  const monitor = useMonitorStore()
  const configStore = useConfigStore()

  const { config } = storeToRefs(configStore)

  const watcher = new Watcher()

  const timer = new Timer(() => {
    watcher.record(monitor.whiteList)
  }, RECORD_TIMER_INTERVAL)

  const _logTimer = new Timer(() => {
    watcher.log()
  }, LOG_TIMER_INTERVAL)

  async function handleSuspend() {
    await suspend()
    timer.destroy()
    await watcher.clear(monitor.whiteList)
  }

  async function handleResume() {
    await resume()
    timer.restart()
  }

  async function restart() {
    await handleSuspend()
    await handleResume()
  }

  watch(() => monitor.whiteList.length, restart)

  onStatusChanged(async ({ payload }) => {
    const { active, path, time } = payload
    const exist = monitor.whiteList.find(i => i.path == path)
    if (!exist) {
      const isStartsWith = config.value.watcherWhitelist.find(folder => path.startsWith(folder))
      if (isStartsWith) {
        const program = await getProgramByPath(path)
        if (program) {
          await db.program.transactionInsert(program)
          await monitor.refresh()
        }
      }
      return
    }

    if (active)
      watcher.activate(path, time)

    else
      watcher.inactivate(path, time)
  })

  onAppSuspend(handleSuspend)

  onAppResume(handleResume)

  onAppClose(async () => {
    timer.destroy()
    await watcher.clear(monitor.whiteList)
  })

  resume()

  return {
    restart,
  }
})
