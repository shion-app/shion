import { onStatusChanged } from 'tauri-plugin-shion-watcher-api'

import type { Maybe } from '@/interfaces'
import { db } from '@/modules/database'
import { Timer } from '@/utils/timer'

interface CurrentVideoResponse {
  AnimeTitle: string | null
  EpisodeTitle: string | null
  Playing: boolean
}

export function useDandanplay() {
  const monitorStore = useMonitorStore()
  const extensionStore = useExtensionStore()

  const { whiteList } = storeToRefs(monitorStore)
  const { config } = storeToRefs(extensionStore)

  let current: CurrentVideoResponse = {
    AnimeTitle: null,
    EpisodeTitle: null,
    Playing: false,
  }
  let timer: Maybe<Timer> = null

  async function getCurrentVideo(port: number): Promise<CurrentVideoResponse> {
    try {
      return await (await fetch(`http://localhost:${port}/api/v1/current/video`)).json()
    }
    catch {
      return {
        AnimeTitle: null,
        EpisodeTitle: null,
        Playing: false,
      }
    }
  }

  function isChanged(response: CurrentVideoResponse) {
    if (current.Playing != response.Playing)
      return true
    return current.AnimeTitle != response.AnimeTitle || current.EpisodeTitle != response.EpisodeTitle
  }

  function start(port: number, programId: number) {
    timer = new Timer(async () => {
      const response = await getCurrentVideo(port)
      const changed = isChanged(response)
      const { Playing, AnimeTitle, EpisodeTitle } = response
      current = response
      if (changed && Playing && AnimeTitle && EpisodeTitle) {
        await db.remark.insert({
          title: AnimeTitle,
          desc: EpisodeTitle,
          time: Date.now(),
          arg: '',
          programId,
        })
      }
    }, calcDuration(1, 'minute'))
  }

  function finish() {
    timer?.destroy(true)
    timer = null
  }

  function activate() {
    const dandanplay = whiteList.value.find(i => i.path == config.value.dandanplay.path)
    if (dandanplay)
      start(config.value.dandanplay.port, dandanplay.id)
  }

  function inactivate() {
    finish()
  }

  onAppResume(() => {
    timer?.restart()
  })

  onAppSuspend(() => {
    timer?.destroy()
  })

  onStatusChanged((e) => {
    const { path, active } = e.payload
    if (path != config.value.dandanplay.path)
      return

    if (active)
      activate()
    else
      inactivate()
  })
}
