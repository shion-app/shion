export class Timer {
  #startTime = Date.now()
  #frame = 0
  #interval = 0
  #immediate = false
  #destroyed = false
  #callback: Function = () => {}

  constructor(callback: Function, interval: number, immediate = false) {
    this.#callback = callback
    this.#interval = interval
    this.#immediate = immediate
    this.#run()
  }

  #run() {
    if (this.#immediate)
      this.#callback()

    this.#frame = requestAnimationFrame(() => {
      const now = Date.now()
      if (now - this.#startTime >= this.#interval) {
        this.#callback()
        this.#startTime = now
      }
      this.#run()
    })
  }

  restart() {
    if (!this.#destroyed)
      return
    this.#destroyed = false
    this.#run()
  }

  destroy(lastCall = false) {
    if (lastCall)
      this.#callback()

    this.#destroyed = true
    cancelAnimationFrame(this.#frame)
  }
}
