import type { Event } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api'

import type * as backend from '@interfaces/backend'
import { type SelectProgram, db } from '@modules/database'

import exe from '@assets/exe.ico'

export const useMonitor = defineStore('monitor', () => {
  const filtering = ref(false)
  const filterList = ref<Array<backend.Program & {
    checked: boolean
  }>>([])
  const whiteList = ref<SelectProgram[]>([])
  const iconMap = ref(new Map<string, string>())

  async function refresh() {
    whiteList.value = await db.program.select()
  }

  function transformIcon(program: Pick<backend.Program, 'path' | 'icon'>) {
    const { path, icon } = program
    const key = pathToKey(path)
    if (iconMap.value.has(key))
      return
    if (icon.length)
      iconMap.value.set(key, URL.createObjectURL(createIconBlob(icon)))
    else
      iconMap.value.set(key, exe)
  }

  function getIconUrl(path: string) {
    return iconMap.value.get(pathToKey(path))
  }

  refresh()

  watch(filtering, (data) => {
    invoke('toggle_filter_program', {
      data,
    })
    if (!data)
      filterList.value = []
  })

  listen('filter-program', async (event: Event<backend.Program>) => {
    const { payload } = event
    const exist = [...filterList.value, ...whiteList.value].find(i => isPathEqual(i.path, payload.path))
    if (exist)
      return
    filterList.value.unshift({
      ...payload,
      checked: false,
    })
    transformIcon(payload)
  })

  return {
    filtering,
    filterList,
    whiteList,
    getIconUrl,
    refresh,
  }
})
