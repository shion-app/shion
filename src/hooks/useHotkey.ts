import type { KeyHandler } from 'hotkeys-js'
import hotkeys from 'hotkeys-js'

export function useHotkey(key: string, method: KeyHandler) {
  hotkeys(key, method)

  onScopeDispose(() => {
    hotkeys.unbind(key)
  })
}
