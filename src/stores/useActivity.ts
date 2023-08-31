import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'
import { debug } from 'tauri-plugin-log-api'
import { invoke } from '@tauri-apps/api'
import PQueue from 'p-queue'

import type * as backend from '@interfaces/backend'
import type { Program } from '@interfaces/index'

const RECORD_INTERVAL = 1000 * 60
const INACTIVE_TIMEOUT = 1000 * 60

interface Activity {
  id: number
  start: number
  end: number
  path: string
  foreground: boolean
  background: boolean
  timer: Timer
}

class Timer {
  private time = Date.now()
  private timeoutFlag = 0

  constructor(private _timeout: number, private callback: Function) { }

  interval() {
    requestAnimationFrame(() => {
      const now = Date.now()
      if (now - this.time >= this._timeout) {
        this.callback()
        this.time = now
      }
      this.interval()
    })
  }

  timeout() {
    this.timeoutFlag = setTimeout(this.callback, this._timeout)
  }

  reset() {
    clearTimeout(this.timeoutFlag)
    this.timeout()
  }

  end() {
    clearTimeout(this.timeoutFlag)
    this.callback()
  }
}

class Logger {
  foreground = ''

  pushForeground(path: string) {
    if (path != this.foreground) {
      debug(`Foreground path: ${path}`)
      this.foreground = path
    }
  }

  pushBackground(path: string, state: backend.AudioActivity['state']) {
    debug(`Background path: ${path}, state: ${state}`)
  }

  create(path: string) {
    debug(`Create activity path: ${path}`)
  }

  delete(path: string) {
    debug(`Delete activity path: ${path}`)
  }

  reset(path: string) {
    debug(`Reset activity path: ${path}`)
  }
}

class Watcher {
  list: Activity[] = []
  recordTimer: Timer
  logger = new Logger()

  constructor() {
    this.recordTimer = new Timer(RECORD_INTERVAL, () => {
      this.record()
    })
    this.recordTimer.interval()
  }

  private contain(path: string) {
    return this.list.some(i => isPathEqual(i.path, path))
  }

  private find(path: string) {
    return this.list.find(i => isPathEqual(i.path, path))
  }

  async pushForeground(data: backend.Activity, whiteList: Program[]) {
    const { path } = data
    this.logger.pushForeground(path)
    const foreground = this.list.find(i => i.foreground)
    if (foreground && !isPathEqual(path, foreground.path)) {
      foreground.foreground = false
      this.settle(foreground)
    }
    const exist = this.contain(path)
    if (!exist) {
      const activity = await this.create(data, false, whiteList)
      if (!activity)
        return
      this.list.push(activity)
    }
    else {
      const activity = this.find(path)!
      activity.foreground = true
      activity.timer.reset()
    }
  }

  async pushBackground(data: backend.AudioActivity, whiteList: Program[]) {
    const { path, state } = data
    this.logger.pushBackground(path, state)
    const exist = this.contain(path)
    if (!exist) {
      if (state == 'Active') {
        const activity = (await this.create(data, true, whiteList))
        if (!activity)
          return
        this.list.push(activity)
      }
    }
    else {
      const activity = this.find(path)!
      if (state == 'Active') {
        activity.background = true
      }
      else {
        activity.background = false
        this.settle(activity)
      }
    }
  }

  private async create(data: backend.Activity, background: boolean, whiteList: Program[]) {
    const program = whiteList.find(i => isPathEqual(i.path, data.path))
    if (!program)
      return

    const time = Date.now()
    const { lastInsertId: id } = await createActivity({
      startTime: time,
      endTime: time,
      programId: program.id,
    })
    const { path } = data
    this.logger.create(path)

    const activity: Activity = {
      id,
      start: time,
      end: time,
      path,
      foreground: !background,
      background,
      timer: new Timer(INACTIVE_TIMEOUT, () => {
        activity.foreground = false
        if (activity.background)
          return
        this.logger.delete(path)
        updateActivity(id, {
          endTime: Date.now(),
        })
        const index = this.list.findIndex(i => i.id == activity.id)
        if (index != -1)
          this.list.splice(index, 1)
      }),
    }
    if (!background)
      activity.timer.timeout()

    return activity
  }

  private settle(activity: Activity) {
    if (!(activity.foreground || activity.background))
      activity.timer.end()
  }

  private record() {
    for (const activity of this.list) {
      updateActivity(activity.id, {
        endTime: Date.now(),
      })
    }
  }

  end(path: string) {
    const activity = this.find(path)
    if (activity) {
      activity.background = false
      activity.timer.end()
    }
  }
}

export const useActivity = defineStore('activity', () => {
  const monitor = useMonitor()

  const watcher = new Watcher()

  const queue = new PQueue({ concurrency: 1 })

  watchArray(() => monitor.whiteList, async (_, __, added, removed) => {
    if (added.length) {
      for (const { path } of added) {
        const active = await invoke('is_audio_active', {
          path,
        })
        if (active)
          queue.add(() => watcher.pushBackground({ path, state: 'Active' }, monitor.whiteList))
      }
    }
    if (removed.length) {
      for (const { path } of removed)
        watcher.end(path)
    }
  })

  listen('audio-activity', (event: Event<backend.AudioActivity>) => queue.add(() => watcher.pushBackground(event.payload, monitor.whiteList)))

  listen('window-activate', (event: Event<backend.Activity>) => queue.add(() => watcher.pushForeground(event.payload, monitor.whiteList)))
})
