import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { error, info } from '@tauri-apps/plugin-log'

interface Payload {
  chunkLength: number
  contentLength: number
}

export const useUpdateStore = defineStore('update', () => {
  const { t } = useI18n()
  const notify = useNotify()
  const configStore = useConfigStore()

  const { config } = storeToRefs(configStore)

  const precent = ref(0)
  const downloading = ref(false)

  let downloaded = 0

  async function start() {
    downloaded = 0
    try {
      const update = await check()

      if (update?.version) {
        const { open, close } = useConfirmModal({
          attrs: {
            title: t('updater.title'),
            content: t('updater.content', {
              version: update?.version,
            }),
            async onConfirm() {
              close()
              downloading.value = true
              await update.downloadAndInstall()
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

  watchOnce(() => config.value.checkUpdate, (v) => {
    if (v)
      start()
  })

  const logDownloadProgress = useThrottleFn((total: number) => {
    info(`Downloading updater downloaded: ${downloaded}, total: ${total}, precent: ${precent.value}%`)
  }, 1000)

  // TODO: upgrade

  // onUpdaterEvent(({ error: e, status }) => {
  //   if (downloading.value && e) {
  //     downloading.value = false
  //     notify.error({
  //       text: t('updater.updating'),
  //     })
  //     error(`Updater event ${e}, ${status}`)
  //   }
  // })

  // listen<Payload>(TauriEvent.DOWNLOAD_PROGRESS, ({ payload }: { payload: Payload }) => {
  //   const { contentLength, chunkLength } = payload
  //   downloaded += chunkLength
  //   precent.value = ~~(downloaded / contentLength * 100)
  //   downloading.value = precent.value != 100
  //   logDownloadProgress(contentLength)
  //   if (!downloading.value)
  //     info('Download completed')
  // })

  return {
    start,
    precent,
    downloading,
  }
})
