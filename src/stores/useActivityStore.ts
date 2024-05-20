import { onStatusChanged, resume, suspend } from 'tauri-plugin-shion-watcher-api'
import { debug } from '@tauri-apps/plugin-log'

import type { SelectProgram } from '@/modules/database'
import { db } from '@/modules/database'

const MIN_TIME_SLICE = 10 * 1000
const TIMER_INTERVAL = 60 * 1000

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
}

export const useActivityStore = defineStore('activity', () => {
  const monitor = useMonitorStore()

  const watcher = new Watcher()

  const timer = new Timer(() => {
    watcher.record(monitor.whiteList)
  }, TIMER_INTERVAL)

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

  onStatusChanged(({ payload }) => {
    const { active, path, time } = payload
    const exist = monitor.whiteList.find(i => i.path == path)
    if (!exist)
      return

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
