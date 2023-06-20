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

  function isCaseInsensitivePathEqual(base: string, target: string) {
    return base.toLowerCase() == target.toLowerCase()
  }

  function getIconUrl(path: string) {
    return iconMap.value.get(path.toLowerCase())
  }

  init()

  watch(filtering, (data) => {
    invoke('toggle_filter_program', {
      data,
    })
    if (!data)
      filterList.value = []
  })

  listen('filter-program', async (event: Event<backend.Program>) => {
    const { payload } = event
    const exist = [...filterList.value, ...whiteList.value].find(i => isCaseInsensitivePathEqual(i.path, payload.path))
    if (exist)
      return
    filterList.value.unshift(payload)
    transformIcon(payload)
  })

  return {
    filtering,
    filterList,
    whiteList,
    getIconUrl,
  }
})
