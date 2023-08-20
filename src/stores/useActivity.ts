import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

import type * as backend from '@interfaces/backend'
import type { Program } from '@interfaces/index'
import { invoke } from '@tauri-apps/api'
import { debug } from 'tauri-plugin-log-api'

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

class Watcher {
  list: Activity[] = []
  recordTimer: Timer
  audioTimer: Timer

  constructor() {
    this.recordTimer = new Timer(1000 * 60, () => {
      this.record()
    })
    this.recordTimer.interval()
    this.audioTimer = new Timer(1000 * 10, () => {
      this.checkAudioStatus()
    })
    this.audioTimer.interval()
  }

  contain(path: string) {
    return this.list.some(i => isPathEqual(i.path, path))
  }

  find(path: string) {
    return this.list.find(i => isPathEqual(i.path, path))
  }

  async pushForeground(data: backend.Activity, whiteList: Program[]) {
    const { path } = data
    const foreground = this.list.find(i => i.foreground)
    if (foreground) {
      if (isPathEqual(path, foreground.path))
        return

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
    debug(`Audio activity path: ${path}, state: ${state}`)
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
    const { path } = data
    if (!background) {
      background = await invoke('is_audio_active', {
        path,
      })
    }
    debug(`Create activity path: ${path}, background: ${background}`)
    const activity: Activity = {
      id,
      start: time,
      end: time,
      path,
      foreground: !background,
      background,
      timer: new Timer(1000 * 60, () => {
        if (activity.background)
          return
        debug(`Delete activity path: ${path}`)
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

  settle(activity: Activity) {
    if (!(activity.foreground || activity.background))
      activity.timer.end()
  }

  activate() {
    const foreground = this.list.find(i => i.foreground)
    foreground?.timer.reset()
  }

  record() {
    for (const activity of this.list) {
      updateActivity(activity.id, {
        endTime: Date.now(),
      })
    }
  }

  async checkAudioStatus() {
    for (const activity of this.list) {
      const active = await invoke<boolean>('is_audio_active', {
        path: activity.path,
      })
      if (active != activity.background)
        debug(`Activity path: ${activity.path}, state (${activity.background} => ${active})`)

      activity.background = active
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
    watcher.pushBackground(event.payload, monitor.whiteList)
  })

  listen('window-activate', () => watcher.activate())
})
