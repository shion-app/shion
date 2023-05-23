import { sendNotification } from '@tauri-apps/api/notification'

export const useTime = defineStore('time', () => {
  const { t } = useI18n()

  const running = ref(false)
  const spend = ref(0)
  const countdown = ref(false)

  let startTime = 0
  let endTime = 0
  let currentTime = 0
  let frame: number
  const INTERVAL = 1000 * 60
  let _update: (() => Promise<unknown>) | null
  let _countdownTime: number

  const time = computed(() => formatTime(countdown.value ? Math.abs(_countdownTime - spend.value) : spend.value))
  const isCountdownOver = computed(() => spend.value > _countdownTime)

  function start(_countdown: boolean, time: number, update: () => Promise<unknown>) {
    _update = update
    countdown.value = _countdown
    _countdownTime = time
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
    countdown.value = false
    _countdownTime = 0
  }

  function formatTime(time: number) {
    const { complement, raw } = extractTime(time)
    const { milli, second, minute, hour } = complement
    const result = `${minute}:${second}.${milli}`
    return raw.hour ? `${hour}:${result}` : result
  }

  whenever(isCountdownOver, async () => {
    sendNotification(t('timer.countdown'))
  })

  return {
    running,
    countdown,
    isCountdownOver,
    time,
    start,
    finish,
  }
})
