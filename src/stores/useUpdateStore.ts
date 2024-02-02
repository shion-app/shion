import type { Update } from '@tauri-apps/plugin-updater'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { error } from '@tauri-apps/plugin-log'

export const useUpdateStore = defineStore('update', () => {
  const { t } = useI18n()
  const notify = useNotify()
  const configStore = useConfigStore()

  const { config } = storeToRefs(configStore)

  const updating = ref(false)

  let handleConfrim = () => {}

  const modal = useConfirmModal({
    attrs: {
      title: t('updater.title'),
      options: {
        loading: true,
      },
      onConfirm() {
        handleConfrim()
      },
      onClosed() {
        updating.value = false
      },
    },
  })

  async function start(showInfo = false) {
    updating.value = true
    let update: Update | null
    try {
      update = await check({
        timeout: 6,
      })
    }
    catch (e) {
      updating.value = false
      notify.error({
        text: t('updater.checkUpdate'),
      })
      return error(e as string)
    }

    if (update) {
      modal.patchOptions({
        content: t('updater.content', {
          version: update!.version,
        }),
      })

      handleConfrim = async () => {
        try {
          await update!.downloadAndInstall()
          await relaunch()
        }
        catch (e) {
          close()
          notify.error({
            text: t('updater.updating'),
          })
          error(e as string)
        }
      }

      return modal.open
    }
    else {
      updating.value = false
      if (showInfo) {
        notify.info({
          text: t('updater.latest'),
        })
      }
    }
  }

  watchOnce(() => config.value.checkUpdate, async (v) => {
    if (v) {
      const open = await start()
      open?.()
    }
  })

  return {
    start,
    updating,
  }
})
