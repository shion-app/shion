// import type { Event } from '@tauri-apps/api/event'
// import { listen } from '@tauri-apps/api/event'
// import { core } from '@tauri-apps/api'
import PQueue from 'p-queue'

// import { type SelectProgram, db } from '@/modules/database'
// import type * as backend from '@/interfaces/backend'

export const useActivityStore = defineStore('activity', () => {
  const monitor = useMonitorStore()

  const queue = new PQueue({ concurrency: 1 })

  watchArray(() => monitor.whiteList, async (_, __, added, removed) => {
  })
})
