import { isActive, onStatusChanged } from 'tauri-plugin-shion-watcher-api'
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
    const { start, end } = activity
    if (end - start < MIN_TIME_SLICE)
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
}

export const useActivityStore = defineStore('activity', () => {
  const monitor = useMonitorStore()

  const watcher = new Watcher()

  const timer = new Timer(() => {
    watcher.record(monitor.whiteList)
  }, TIMER_INTERVAL)

  watchArray(() => monitor.whiteList, async (_, __, added, removed) => {
    const updated: number[] = []
    for (const p1 of added) {
      for (const p2 of removed) {
        if (p1.id == p2.id)
          updated.push(p1.id)
      }
    }
    for (const program of added) {
      if (updated.includes(program.id))
        continue
      const active = await isActive(program.path)
      if (active)
        watcher.activate(program.path, Date.now())
    }
    for (const program of removed) {
      if (updated.includes(program.id))
        continue
      watcher.inactivate(program.path, Date.now())
    }
  })

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
})
