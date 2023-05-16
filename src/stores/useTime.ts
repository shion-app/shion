export const useTime = defineStore('time', () => {
  const running = ref(false)
  const spend = ref(0)
  const time = computed(() => formatTime(spend.value))

  let startTime = 0
  let endTime = 0
  let currentTime = 0
  let frame: number
  const INTERVAL = 1000 * 60
  let _update: (() => Promise<unknown>) | null

  function start(update: () => Promise<unknown>) {
    _update = update
    running.value = true
    currentTime = endTime = startTime = Date.now()
    count()
  }

  function count() {
    frame = requestAnimationFrame(() => {
      endTime = Date.now()
      if (endTime - currentTime > INTERVAL) {
        currentTime = endTime
        _update!()
      }

      spend.value = endTime - startTime
      count()
    })
  }

  async function finish() {
    running.value = false
    cancelAnimationFrame(frame)
    await _update!()
    reset()
  }

  function reset() {
    startTime = endTime = currentTime = 0
    spend.value = 0
    _update = null
  }

  function formatTime(time: number) {
    const { complement, raw } = extractTime(time)
    const { milli, second, minute, hour } = complement
    const result = `${minute}:${second}.${milli}`
    return raw.hour ? `${hour}:${result}` : result
  }

  return {
    running,
    time,
    start,
    finish,
  }
})
