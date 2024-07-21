import { Timer } from '@/utils/timer'

export const useTimerStore = defineStore('timer', () => {
  const running = ref(false)
  const spend = ref(0)
  const text = ref('')

  const time = computed(() => formatTime(spend.value))

  let startTime = 0
  const FPS = 60

  let taskTimer: Timer | null = null
  let countTimer: Timer | null = null

  function start(update: () => Promise<unknown>) {
    running.value = true
    startTime = Date.now()
    taskTimer = new Timer(update, calcDuration(1, 'minute'))
    countTimer = new Timer(() => {
      spend.value = Date.now() - startTime
    }, calcDuration(1, 'second') / FPS)
  }

  async function finish() {
    running.value = false
    await taskTimer?.destroy(true)
    countTimer?.destroy()
    reset()
  }

  function reset() {
    taskTimer = null
    countTimer = null
    startTime = 0
    spend.value = 0
  }

  function formatTime(time: number) {
    const { complement, raw } = extractTime(time)
    const { milli, second, minute, hour } = complement
    const result = `${minute}:${second}.${milli}`
    return raw.hour ? `${hour}:${result}` : result
  }

  function setText(v: string) {
    text.value = v
  }

  onAppClose(async () => {
    if (running.value)
      await finish()
  })

  onAppSuspend(() => {
    taskTimer?.destroy()
  })

  onAppResume(() => {
    taskTimer?.restart()
  })

  return {
    running,
    time,
    start,
    finish,
    setText,
    text,
  }
})
