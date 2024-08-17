import type { InsertRemark } from '../database'
import { db } from '../database'

interface CurrentVideoResponse {
  AnimeTitle: string | null
  EpisodeTitle: string | null
  Playing: boolean
}

export function dandanplay() {
  let current: CurrentVideoResponse = {
    AnimeTitle: null,
    EpisodeTitle: null,
    Playing: false,
  }
  let _port = 0
  let _programId = 0

  async function getCurrentVideo(): Promise<CurrentVideoResponse> {
    try {
      return await (await fetch(`http://localhost:${_port}/api/v1/current/video`)).json()
    }
    catch {
      return {
        AnimeTitle: null,
        EpisodeTitle: null,
        Playing: false,
      }
    }
  }

  async function createRemark(remark: InsertRemark) {
    await db.remark.insert(remark)
  }

  function isChanged(response: CurrentVideoResponse) {
    if (current.Playing != response.Playing)
      return true
    return current.AnimeTitle != response.AnimeTitle || current.EpisodeTitle != response.EpisodeTitle
  }

  const timer = new Timer(async () => {
    const response = await getCurrentVideo()
    const changed = isChanged(response)
    const { Playing, AnimeTitle, EpisodeTitle } = response
    current = response
    if (changed && Playing && AnimeTitle && EpisodeTitle) {
      await createRemark({
        title: AnimeTitle,
        desc: EpisodeTitle,
        time: Date.now(),
        arg: '',
        programId: _programId,
      })
    }
  }, calcDuration(1, 'minute'))

  timer.destroy()

  function activate(port: number, programId: number) {
    _port = port
    _programId = programId
    timer.restart()
  }

  function inactivate() {
    timer.destroy(true)
  }

  return {
    activate,
    inactivate,
  }
}
