import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

import type * as backend from '@interfaces/backend'
import type { Program } from '@interfaces/index'

interface Activity {
  id: number
  start: number
  end: number
  path: string
  foreground: boolean
  background: boolean
  reset: boolean
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

class Watcher {
  list: Activity[] = []
  timer: Timer

  constructor() {
    this.timer = new Timer(1000 * 60, () => {
      this.record()
    })
    this.timer.interval()
  }

  contain(path: string) {
    return this.list.some(i => isPathEqual(i.path, path))
  }

  find(path: string) {
    return this.list.find(i => isPathEqual(i.path, path))
  }

  async pushForeground(data: backend.Activity, whiteList: Program[]) {
    const { path } = data
    const exist = this.contain(path)
    const foreground = this.list.find(i => i.foreground)
    if (foreground) {
      foreground.foreground = false
      this.settle(foreground)
    }
    if (!exist) {
      const activity = await this.create(data, false, whiteList)
      if (!activity)
        return
      this.list.push(activity)
    }
    else {
      const activity = this.find(path)!
      activity.foreground = true
      activity.reset = true
      this.settle(activity)
    }
  }

  async pushBackground(data: backend.AudioActivity, whiteList: Program[]) {
    const { path, state } = data
    const exist = this.contain(path)
    if (!exist) {
      if (state == 'Active') {
        const activity = (await this.create(data, true, whiteList))!
        this.list.push(activity)
      }
    }
    else {
      if (state == 'Inactive' || state == 'Expired') {
        const activity = this.find(path)!
        activity.background = false
        this.settle(activity)
      }
    }
  }

  async create(data: backend.Activity, background: boolean, whiteList: Program[]) {
    const program = whiteList.find(i => isPathEqual(i.path, data.path))
    if (!program)
      return

    const time = Date.now()
    const { lastInsertId: id } = await createActivity({
      startTime: time,
      endTime: time,
      programId: program.id,
    })
    const activity: Activity = {
      id,
      start: time,
      end: time,
      path: data.path,
      foreground: !background,
      background,
      reset: false,
      timer: new Timer(1000 * 10, () => {
        if (activity.background)
          return
        updateActivity(id, {
          endTime: Date.now(),
        })
        this.clear(activity)
      }),
    }
    if (!background)
      activity.timer.timeout()

    return activity
  }

  clear(activity: Activity) {
    const index = this.list.findIndex(i => i.id == activity.id)
    if (index != -1)
      this.list.splice(index, 1)
  }

  settle(activity: Activity) {
    if (activity.reset) {
      activity.timer.reset()
      activity.reset = false
    }
    if (!(activity.foreground || activity.background))
      activity.timer.end()
  }

  activate() {
    const foreground = this.list.find(i => i.foreground)
    foreground?.timer.reset()
  }

  close() {
    for (const activity of this.list) {
      activity.background = false
      activity.foreground = false
      this.settle(activity)
    }
  }

  record() {
    for (const activity of this.list) {
      updateActivity(activity.id, {
        endTime: Date.now(),
      })
    }
  }
}

export const useActivity = defineStore('activity', () => {
  const monitor = useMonitor()

  const watcher = new Watcher()

  listen('window-activity', async (event: Event<backend.Activity>) => {
    watcher.pushForeground(event.payload, monitor.whiteList)
  })

  listen('audio-activity', (event: Event<backend.AudioActivity>) => {
    const exist = monitor.whiteList.some(i => isPathEqual(i.path, event.payload.path))
    if (!exist)
      return

    watcher.pushBackground(event.payload, monitor.whiteList)
  })

  listen('window-activate', () => watcher.activate())

  whenever(() => monitor.filtering, () => watcher.close())
})
