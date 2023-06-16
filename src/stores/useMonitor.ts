import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

import type { Activity, Program, SavedProgram } from '@interfaces/index'

export const useMonitor = defineStore('monitor', () => {
  const filtering = ref(false)
  const whiteList = ref<SavedProgram[]>([])

  let timeout: number
  let task = () => {}

  listen('filter-program', (event: Event<Program>) => {
    const { path, description } = event.payload
    const exist = whiteList.value.find(i => i.path == path)
    if (exist)
      return
    whiteList.value.push({
      path,
      description,
    })
    // TODO: database
  })

  listen('program-activity', (event: Event<Activity>) => {
    const { payload } = event
    const exist = whiteList.value.find(i => i.path == payload.path)
    if (!exist)
      return
    // TODO: database
    const delay = 1000 * 60
    task = () => {
      timeout = setTimeout(() => {
        // TODO: database
      }, delay)
    }
  })

  const activate = useThrottleFn(() => {
    clearTimeout(timeout)
    task()
  }, 1000)

  listen('program-activity-activate', activate)

  return {
    filtering,
  }
})
