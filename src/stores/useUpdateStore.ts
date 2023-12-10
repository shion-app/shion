import { TauriEvent, listen } from '@tauri-apps/api/event'
import { checkUpdate, installUpdate, onUpdaterEvent } from '@tauri-apps/api/updater'
import { error, info } from 'tauri-plugin-log-api'
import { relaunch } from '@tauri-apps/api/process'

interface Payload {
  chunkLength: number
  contentLength: number
}

export const useUpdateStore = defineStore('update', () => {
  const { t } = useI18n()
  const notify = useNotify()

  const precent = ref(0)
  const downloading = ref(false)

  let downloaded = 0

  async function start() {
    downloaded = 0
    try {
      const { shouldUpdate, manifest } = await checkUpdate()

      if (shouldUpdate) {
        const { open, close } = useConfirmModal({
          attrs: {
            title: t('updater.title'),
            content: t('updater.content', {
              version: manifest?.version,
            }),
            async onConfirm() {
              close()
              downloading.value = true
              // Install the update. This will also restart the app on Windows!
              await installUpdate()

              // On macOS and Linux you will need to restart the app manually.
              // You could use this step to display another confirmation dialog.
              await relaunch()
            },
          },
        })
        open()
      }
    }
    catch (e) {
      notify.error({
        text: t('updater.checkUpdate'),
      })
      error(e as string)
    }
  }

  const logDownloadProgress = useThrottleFn((total: number) => {
    info(`Downloading updater downloaded: ${downloaded}, total: ${total}, precent: ${precent.value}%`)
  }, 1000)

  onUpdaterEvent(({ error: e, status }) => {
    if (downloading.value && e) {
      downloading.value = false
      notify.error({
        text: t('updater.updating'),
      })
      error(`Updater event ${e}, ${status}`)
    }
  })

  listen<Payload>(TauriEvent.DOWNLOAD_PROGRESS, ({ payload }: { payload: Payload }) => {
    const { contentLength, chunkLength } = payload
    downloaded += chunkLength
    precent.value = ~~(downloaded / contentLength * 100)
    downloading.value = precent.value != 100
    logDownloadProgress(contentLength)
    if (!downloading.value)
      info('Download completed')
  })

  return {
    start,
    precent,
    downloading,
  }
})
