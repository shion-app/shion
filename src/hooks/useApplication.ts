import { exit } from '@tauri-apps/plugin-process'
import { listen } from '@tauri-apps/api/event'

type CloseHook = () => unknown

class Application {
  #closeHookList: CloseHook[] = []

  async close() {
    await Promise.allSettled(this.#closeHookList.map(cb => cb()))
    await exit()
  }

  addCloseHook(cb: CloseHook) {
    this.#closeHookList.push(cb)
  }
}

const application = new Application()

listen('quit', () => application.close())

export function useApplication() {
  return application
}
