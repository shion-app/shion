import { TauriEvent, listen } from '@tauri-apps/api/event'
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { error, info } from 'tauri-plugin-log-api'
import { relaunch } from '@tauri-apps/api/process'
import { Modal } from 'ant-design-vue'

interface Payload {
  chunkLength: number
  contentLength: number
}

export const useUpdate = defineStore('update', () => {
  const { t } = useI18n()

  let downloaded = 0
  const precent = ref(0)

  async function start() {
    downloaded = 0
    try {
      const { shouldUpdate, manifest } = await checkUpdate()

      if (shouldUpdate) {
        const { destroy } = Modal.confirm({
          title: t('updater.title'),
          content: t('updater.content', {
            version: manifest?.version,
          }),
          async onOk() {
            destroy()
            // Install the update. This will also restart the app on Windows!
            await installUpdate()

            // On macOS and Linux you will need to restart the app manually.
            // You could use this step to display another confirmation dialog.
            await relaunch()
          },
        })
      }
    }
    catch (e) {
      error(e as string)
    }
  }

  const logDownloadProgress = useThrottleFn(({ payload }: { payload: Payload }) => {
    const { contentLength, chunkLength } = payload
    downloaded += chunkLength
    precent.value = ~~(downloaded / contentLength * 100)
    info(`Downloading updater downloaded: ${downloaded}, total: ${contentLength}, precent: ${precent.value}%`)
  }, 1000)

  listen<Payload>(TauriEvent.DOWNLOAD_PROGRESS, (logDownloadProgress))

  return {
    start,
    precent,
  }
})
