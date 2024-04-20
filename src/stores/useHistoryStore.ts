import { getConfig, readHistory, setConfig } from 'tauri-plugin-shion-history-api'

import { db } from '@/modules/database'

export const useHistoryStore = defineStore('history', () => {
  const { state } = useAsyncState(getConfig(), {
    browsers: [],
  }, {
    shallow: false,
  })

  async function pull(list: string[], start: number, end: number) {
    const historyList = await readHistory(list, start, end)
    await db.history.batchInsert(historyList.map(({ title, url, last_visited }) => ({
      title,
      url,
      lastVisited: last_visited,
    })))
    for (const browser of state.value.browsers) {
      if (list.includes(browser.name))
        browser.last_sync = end
    }
    await setConfig(state.value)
  }

  async function pullActiveBrowsers() {
    for (const browser of state.value.browsers) {
      if (browser.last_sync > 0)
        await pull([browser.name], browser.last_sync, new Date().getTime())
    }
  }

  return {
    config: state,
    pull,
    pullActiveBrowsers,
  }
})
