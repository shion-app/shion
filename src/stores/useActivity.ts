import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

import type * as backend from '@interfaces/backend'
import type { Activity } from '@interfaces/index'
import { addMinutes } from 'date-fns'

export const useActivity = defineStore('activity', () => {
  const monitor = useMonitor()

  const activityList = ref<Activity[]>([])

  let timeout: number
  let task: (immediate: boolean) => Promise<void> = async () => {}
  let lastActivity: backend.Activity | null = null

  async function init() {
    // Handling situations where the activity process has not been completed, such as "turning off the physical power button"
    const last = await selectLastActivity()
    if (last?.active) {
      await createActivity({
        ...excludeKeys(last, ['id']),
        active: false,
        time: addMinutes(new Date(last.time), 1).getTime(),
      })
    }
    activityList.value = await selectActivity()
  }

  init()

  listen('program-activity', async (event: Event<backend.Activity>) => {
    const { payload } = event
    const exist = lastActivity && isPathEqual(lastActivity.path, payload.path) && lastActivity.title == payload.title
    if (exist)
      return
    const vaildProgram = monitor.whiteList.find(i => isPathEqual(i.path, payload.path))
    if (!vaildProgram) {
      task(true)
      return
    }
    const isAnotherProgram = lastActivity && !isPathEqual(lastActivity.path, payload.path)
    if (isAnotherProgram)
      await task(true)

    lastActivity = payload
    const activity: Omit<Activity, 'id'> = {
      active: true,
      time: payload.time,
      title: payload.title,
      programPath: vaildProgram.path,
      programDescription: vaildProgram.description,
    }
    const { lastInsertId } = await createActivity(activity)
    activityList.value.push({
      ...activity,
      id: lastInsertId,
    })

    task = async (immediate: boolean) => {
      clearTimeout(timeout)
      const fn = async () => {
        const a = {
          ...activity,
          time: Date.now(),
          active: false,
        }
        const { lastInsertId } = await createActivity(a)
        activityList.value.push({
          ...a,
          id: lastInsertId,
        })
        task = async () => { }
        lastActivity = null
      }
      if (immediate) {
        await fn()
      }
      else {
        await new Promise<void>((resolve) => {
          timeout = setTimeout(async () => {
            await fn()
            resolve()
          }, 1000 * 60)
        })
      }
    }
    task(false)
  })

  const activate = useThrottleFn(() => task(false), 1000)

  listen('program-activity-activate', activate)

  return {
    activityList,
  }
})
