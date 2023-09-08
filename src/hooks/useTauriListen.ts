import type { EventCallback, EventName } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

export function useTauriListen<T>(event: EventName, handler: EventCallback<T>) {
  let unlisten = () => {}
  listen(event, handler).then(cb => unlisten = cb)

  onScopeDispose(() => unlisten())
}
