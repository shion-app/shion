import { getConfig, readHistory, setConfig } from 'tauri-plugin-shion-history-api'

import type { InsertHistory } from '@/modules/database'
import { db } from '@/modules/database'

type History = Omit<InsertHistory, 'domainId'>

export const useHistoryStore = defineStore('history', () => {
  const { state } = useAsyncState(getConfig(), {
    browsers: [],
  }, {
    shallow: false,
  })

  const completedCount = ref(0)
  const totalCount = ref(0)
  const requesting = ref(false)
  const progress = computed(() => ~~(completedCount.value * 100 / totalCount.value))
  const progressText = computed(() => `(${completedCount.value}/${totalCount.value}) ${progress.value}%`)

  const { listen } = useDatabase()

  listen('history.insert', () => {
    completedCount.value++
  })

  async function insert(browserList: string[], historyList: Array<History>, end: number) {
    await db.history.batchInsert(historyList)
    for (const browser of state.value.browsers) {
      if (browserList.includes(browser.name))
        browser.last_sync = end
    }
    await setConfig(state.value)
  }

  async function getHistory(list: string[], start: number, end: number) {
    return (await readHistory(list, start, end)).map(({ title, url, last_visited }) => ({
      title,
      url,
      lastVisited: last_visited,
    }))
  }

  async function pull(browserList: string[], start: number, end: number) {
    completedCount.value = 0
    totalCount.value = 0
    requesting.value = true
    try {
      const historyList = await getHistory(browserList, start, end)
      totalCount.value += historyList.length
      await insert(browserList, historyList, end)
    }
    finally {
      requesting.value = false
    }
  }

  async function pullActiveBrowsers() {
    completedCount.value = 0
    totalCount.value = 0
    requesting.value = true
    try {
      const map = new Map<string, Array<History>>()
      for (const browser of state.value.browsers) {
        if (browser.last_sync > 0) {
          const historyList = await getHistory([browser.name], browser.last_sync, new Date().getTime())
          map.set(browser.name, historyList)
          totalCount.value += historyList.length
        }
      }
      for (const browser of state.value.browsers) {
        if (browser.last_sync > 0) {
          const historyList = map.get(browser.name)!
          await insert([browser.name], historyList, new Date().getTime())
        }
      }
    }
    finally {
      requesting.value = false
    }
  }

  return {
    config: state,
    pull,
    pullActiveBrowsers,
    progress,
    progressText,
    requesting,
  }
})
