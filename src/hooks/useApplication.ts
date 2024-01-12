import { exit } from '@tauri-apps/plugin-process'
import { listen } from '@tauri-apps/api/event'

type Hook = () => unknown

class Application {
  #closeHookList: Hook[] = []
  #suspendHookList: Hook[] = []
  #resumeHookList: Hook[] = []

  addCloseHook(cb: Hook) {
    this.#closeHookList.push(cb)
  }

  addSuspendHook(cb: Hook) {
    this.#suspendHookList.push(cb)
  }

  addResumeHook(cb: Hook) {
    this.#resumeHookList.push(cb)
  }

  async close() {
    await Promise.allSettled(this.#closeHookList.map(cb => cb()))
    await exit()
  }

  async suspend() {
    for (const cb of this.#suspendHookList)
      await cb()
  }

  async resume() {
    for (const cb of this.#resumeHookList)
      await cb()
  }
}

const application = new Application()

listen('quit', () => application.close())

export function useApplication() {
  return application
}
