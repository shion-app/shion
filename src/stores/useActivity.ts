import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

import type * as backend from '@interfaces/backend'
import type { Activity } from '@interfaces/index'

export const useActivity = defineStore('activity', () => {
  const monitor = useMonitor()

  const activityList = ref<Activity[]>([])

  let timeout: number
  let task: (immediate: boolean) => Promise<number> = async () => 0
  let lastActivity: backend.Activity | null = null

  async function refresh() {
    activityList.value = await selectActivity()
  }

  refresh()

  listen('program-activity', async (event: Event<backend.Activity>) => {
    const { payload } = event

    const program = monitor.whiteList.find(i => isPathEqual(i.path, payload.path))
    const isInWhiteList = !!program
    if (!isInWhiteList) {
      task(true)
      return
    }

    const exist = lastActivity && isPathEqual(lastActivity.path, payload.path) && lastActivity.title == payload.title
    if (exist)
      return

    const isAnotherProgram = lastActivity && !isPathEqual(lastActivity.path, payload.path)
    if (isAnotherProgram) {
      await task(true)
      lastActivity = null
    }

    const isUpdate = !!lastActivity
    if (isUpdate) {
      const id = await task(true)
      await updateActivity(id, {
        active: true,
      })
    }

    lastActivity = payload
    const activity: Omit<Activity, 'id'> = {
      active: true,
      time: payload.time,
      title: payload.title,
      programPath: program.path,
      programDescription: program.description,
    }
    if (!isUpdate)
      await createActivity(activity)

    const { lastInsertId: inactiveId } = await createActivity({
      ...activity,
      active: false,
    })
    await refresh()

    task = async (immediate: boolean) => {
      clearTimeout(timeout)
      const fn = async () => {
        const time = Date.now()
        await updateActivity(inactiveId, {
          time,
        })
        await refresh()
        task = async () => 0
        lastActivity = null
        return inactiveId
      }
      if (immediate) {
        return await fn()
      }
      else {
        return await new Promise<number>((resolve) => {
          timeout = setTimeout(async () => {
            resolve(await fn())
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
