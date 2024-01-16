import { type SelectProgram, db } from '@/modules/database'

export const useMonitorStore = defineStore('monitor', () => {
  const whiteList = ref<Array<SelectProgram & { selected: boolean }>>([])

  async function refresh() {
    whiteList.value = (await db.program.select()).map(i => ({
      ...i,
      selected: false,
    }))
  }

  refresh()

  return {
    whiteList,
    refresh,
  }
})
