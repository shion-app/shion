import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

import type { Program } from '@interfaces/index'

import type * as backend from '@interfaces/backend'
import { invoke } from '@tauri-apps/api'

export const useMonitor = defineStore('monitor', () => {
  const filtering = ref(false)
  const filterList = ref<backend.Program[]>([])
  const whiteList = ref<Program[]>([])

  let timeout: number
  let task = () => {}
  let lastActivity: backend.Activity | null = null

  async function init() {
    whiteList.value = await selectProgram()
  }

  init()

  watch(filtering, (v) => {
    if (v)
      invoke('toggle_filter_program')
    else
      filterList.value = []
  })

  listen('filter-program', async (event: Event<backend.Program>) => {
    const { payload } = event
    const exist = [...filterList.value, ...whiteList.value].find(i => i.path == payload.path)
    if (exist)
      return
    filterList.value.push(payload)
  })

  listen('program-activity', (event: Event<backend.Activity>) => {
    const { payload } = event
    const program = whiteList.value.find(i => i.path == payload.path)
    if (!program)
      return
    const exist = lastActivity?.path == payload.path && lastActivity.title == payload.title
    if (exist)
      return
    lastActivity = payload
    const activity = {
      programId: program.id,
      active: true,
      time: payload.time,
      title: payload.title,
    }
    createActivity(activity)
    task = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        createActivity({
          ...activity,
          active: false,
        })
        task = () => {}
        lastActivity = null
      }, 1000 * 60)
    }
    task()
  })

  const activate = useThrottleFn(task, 1000)

  listen('program-activity-activate', activate)

  return {
    filtering,
    filterList,
    whiteList,
  }
})
