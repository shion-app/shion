export class Timer {
  #startTime = Date.now()
  #frame = 0
  #interval = 0
  #callback: Function = () => {}

  constructor(callback: Function, interval: number) {
    this.#callback = callback
    this.#interval = interval
    this.#run()
  }

  #run() {
    this.#frame = requestAnimationFrame(() => {
      const now = Date.now()
      if (now - this.#startTime >= this.#interval) {
        this.#callback()
        this.#startTime = now
      }
      this.#run()
    })
  }

  destroy() {
    this.#callback()
    cancelAnimationFrame(this.#frame)
  }
}
