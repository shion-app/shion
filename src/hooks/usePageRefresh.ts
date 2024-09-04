import { error } from '@tauri-apps/plugin-log'
import { emitter } from '@/plugins/mitt'

const registered = ref(false)
const loading = ref(false)

export function usePageRefresh() {
  const { t } = useI18n()
  const notify = useNotify()

  function refresh() {
    loading.value = true
    emitter.emit('page-refresh')
  }

  function onRefresh(cb: () => Promise<unknown>) {
    registered.value = true
    emitter.on('page-refresh', async () => {
      try {
        await cb()
        await sleep(300)
      }
      catch (e) {
        notify.error({
          text: `${t('refresh.error')}: ${e}`,
        })
        error('refresh error: ', e as any)
        throw e
      }
      finally {
        loading.value = false
      }
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
