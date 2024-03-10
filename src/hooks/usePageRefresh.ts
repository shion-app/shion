import { emitter } from '@/plugins/mitt'

const registered = ref(false)
const loading = ref(false)

export function usePageRefresh() {
  function refresh() {
    loading.value = true
    emitter.emit('page-refresh')
  }

  function onRefresh(cb: () => Promise<unknown>) {
    registered.value = true
    emitter.on('page-refresh', async () => {
      await cb()
      await sleep(300)
      loading.value = false
    })
    onScopeDispose(() => {
      registered.value = false
      loading.value = false
      emitter.off('page-refresh')
    })
  }

  return {
    refresh,
    onRefresh,
    registered,
    loading,
  }
}
