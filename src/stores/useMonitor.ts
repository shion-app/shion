import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api'

import type { Program } from '@interfaces/index'
import type * as backend from '@interfaces/backend'

import exe from '@assets/exe.ico'

export const useMonitor = defineStore('monitor', () => {
  const filtering = ref(false)
  const filterList = ref<backend.Program[]>([])
  const whiteList = ref<Program[]>([])
  const iconMap = ref(new Map<string, string>())

  let timeout: number
  let task: (immediate: boolean) => void = () => {}
  let lastActivity: backend.Activity | null = null

  async function init() {
    whiteList.value = await selectProgram()
    whiteList.value.forEach(transformIcon)
  }

  function transformIcon(program: Pick<backend.Program, 'path' | 'icon'>) {
    const { path, icon } = program
    const p = path.toLowerCase()
    if (iconMap.value.has(p))
      return
    if (icon.length)
      iconMap.value.set(p, URL.createObjectURL(new Blob([new Uint8Array(icon)], { type: 'image/png' })))
    else
      iconMap.value.set(p, exe)
  }

  function isPathEqual(base: string, target: string) {
    return base.toLowerCase() == target.toLowerCase()
  }

  function getIconUrl(path: string) {
    return iconMap.value.get(path.toLowerCase())
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
    const exist = [...filterList.value, ...whiteList.value].find(i => isPathEqual(i.path, payload.path))
    if (exist)
      return
    filterList.value.unshift(payload)
    transformIcon(payload)
  })

  listen('program-activity', (event: Event<backend.Activity>) => {
    const { payload } = event
    const exist = lastActivity && isPathEqual(lastActivity.path, payload.path) && lastActivity.title == payload.title
    if (exist)
      return
    const program = whiteList.value.find(i => isPathEqual(i.path, payload.path))
    if (!program) {
      task(true)
      return
    }

    lastActivity = payload
    const activity = {
      programId: program.id,
      active: true,
      time: payload.time,
      title: payload.title,
    }
    createActivity(activity)

    task = (immediate: boolean) => {
      clearTimeout(timeout)
      const fn = () => {
        createActivity({
          ...activity,
          time: Date.now(),
          active: false,
        })
        task = () => { }
        lastActivity = null
      }
      if (immediate)
        fn()
      else
        timeout = setTimeout(fn, 1000 * 60)
    }
    task(false)
  })

  const activate = useThrottleFn(() => task(false), 1000)

  listen('program-activity-activate', activate)

  return {
    filtering,
    filterList,
    whiteList,
    getIconUrl,
  }
})
