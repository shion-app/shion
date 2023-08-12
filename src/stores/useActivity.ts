import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

import type * as backend from '@interfaces/backend'
import type { Program } from '@interfaces/index'

interface Activity {
  id: number
  start: number
  end: number
  path: string
  timer: Timer
}

class Timer {
  timer = 0

  constructor(private timeout: number, private task: Function) {
    this.start()
  }

  start() {
    this.timer = setTimeout(this.task, this.timeout)
  }

  reset() {
    clearTimeout(this.timer)
    this.start()
  }

  cancel() {
    clearTimeout(this.timer)
    this.task()
  }
}

class Watcher {
  foreground: Activity | null = null
  background: Activity[] = []

  async push(data: backend.Activity, type: 'foreground' | 'background', whiteList: Program[]) {
    if (type == 'foreground') {
      const index = this.background.findIndex(i => isPathEqual(i.path, data.path))
      const background = this.background[index]
      if (background) {
        this.background.splice(index, 1)
        this.foreground?.timer.cancel()
        this.foreground = background
        this.foreground.timer.reset()
      }
      else {
        this.foreground?.timer.cancel()
        this.foreground = await this.create(data, whiteList)
      }
    }
    else {
      const activity = await this.create(data, whiteList)
      this.background.push(activity)
    }
  }

  async create(activity: backend.Activity, whiteList: Program[]) {
    const programId = whiteList.find(i => isPathEqual(i.path, activity.path))!.id
    const { lastInsertId } = await createActivity({
      startTime: activity.time,
      endTime: activity.time,
      programId,
    })
    const timer = new Timer(1000 * 60, () => {
      updateActivity(lastInsertId, {
        endTime: Date.now(),
      })
    })
    timer.start()
    return {
      id: lastInsertId,
      start: activity.time,
      end: activity.time,
      path: activity.path,
      timer,
    }
  }

  activate() {
    this.foreground?.timer.reset()
  }

  close() {
    this.foreground?.timer.cancel()
    for (const activity of this.background)
      activity.timer.cancel()
    this.foreground = null
    this.background = []
  }
}

export const useActivity = defineStore('activity', () => {
  const monitor = useMonitor()

  const watcher = new Watcher()

  listen('program-activity', async (event: Event<backend.Activity>) => {
    const { payload } = event

    const program = monitor.whiteList.find(i => isPathEqual(i.path, payload.path))
    if (!program)
      return

    watcher.push(payload, 'foreground', monitor.whiteList)
  })

  listen('program-activity-activate', () => watcher.activate())

  whenever(() => monitor.filtering, () => watcher.close())
})
