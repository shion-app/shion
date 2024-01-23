import { emitter } from '@/plugins/mitt'

const registered = ref(false)

export function usePageRefresh() {
  function refresh() {
    emitter.emit('page-refresh')
  }

  function onRefresh(fn: Function) {
    registered.value = true
    emitter.on('page-refresh', () => fn())
    onScopeDispose(() => {
      registered.value = false
      emitter.off('page-refresh')
    })
  }

  return {
    refresh,
    onRefresh,
    registered,
  }
}
