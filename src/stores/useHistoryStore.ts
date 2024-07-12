import type { Browser } from 'tauri-plugin-shion-history-api'
import { getConfig, readHistory, setConfig } from 'tauri-plugin-shion-history-api'

import { info } from '@tauri-apps/plugin-log'
import type { InsertHistory } from '@/modules/database'
import { db } from '@/modules/database'

type History = Omit<InsertHistory, 'domainId'>

export const useHistoryStore = defineStore('history', () => {
  const { state } = useAsyncState(getConfig(), {
    browsers: [],
  }, {
    shallow: false,
  })

  const { listen } = useDatabase()

  const completedCount = ref(0)
  const totalCount = ref(0)
  const requesting = ref(false)
  const progress = computed(() => ~~(completedCount.value * 100 / totalCount.value))
  const progressText = computed(() => `(${completedCount.value}/${totalCount.value}) ${progress.value}%`)

  listen('history.insert', () => {
    completedCount.value++
  })

  async function insert(name: string, historyList: Array<History>, end: number) {
    if (historyList.length == 0)
      return

    await db.history.batchInsert(historyList)
    for (const browser of state.value.browsers) {
      if (browser.name == name) {
        browser.last_sync = end
        break
      }
    }
    await setConfig(state.value)
  }

  async function pullBrowsers(browsers: Array<Browser>) {
    if (requesting.value)
      return 0

    completedCount.value = 0
    totalCount.value = 0
    requesting.value = true
    const map = new Map<string, Array<History>>()
    const end = new Date().getTime()
    try {
      for (const browser of browsers) {
        const historyList = (await readHistory(browser.name, browser.last_sync, end)).map(({ title, url, last_visited }) => ({
          title,
          url,
          lastVisited: last_visited,
        }))
        map.set(browser.name, historyList)
        totalCount.value += historyList.length
      }
      for (const browser of browsers) {
        const historyList = map.get(browser.name)!
        await insert(browser.name, historyList, end)
      }
    }
    finally {
      requesting.value = false
    }
    const len = [...map].flatMap(([_, list]) => list).length
    return len
  }

  async function pull() {
    const browsers = state.value.browsers.filter(i => i.last_sync == 0)
    return await pullBrowsers(browsers)
  }

  async function pullActiveBrowsers() {
    const browsers = state.value.browsers.filter(i => i.last_sync > 0)
    await pullBrowsers(browsers)
  }

  const timer = new Timer(async () => {
    info('scheduled task(history): in progress...')
    await pullActiveBrowsers()
    info('scheduled task(history): completed')
  }, calcDuration(30, 'minute'))

  onAppSuspend(() => {
    timer.destroy()
  })

  onAppResume(() => {
    timer.restart()
  })

  return {
    config: state,
    pull,
    pullActiveBrowsers,
    progress,
    progressText,
    requesting,
  }
})
