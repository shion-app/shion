import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import { BaseDirectory, exists, writeTextFile } from '@tauri-apps/plugin-fs'
import { error } from '@tauri-apps/plugin-log'

export interface Migration {
  version: string
  base: string
}

export const MIGRATION_FOLDER = 'migrate'
export const MIGRATION_FILENAME = 'migration.json'

export const useExportStore = defineStore('export', () => {
  const notify = useNotify()
  const { format } = useDateFns()

  const configStore = useConfigStore()

  const { config } = storeToRefs(configStore)

  const exporting = ref(false)

  async function handleExport(path: string) {
    if (exporting.value)
      return false

    const dest = await join(path, `shion-${format(new Date(), 'yyyy-MM-dd')}.zip`)

    const appDataDirPath = await appDataDir()
    exporting.value = true
    await suspendApp()
    try {
      await generateMigrationFile()
      await invoke('compress', {
        target: appDataDirPath,
        dest,
      })
    }
    catch (e) {
      error(`export error:${e}`)
      notify.error({
        text: e as any,
      })
      return false
    }
    finally {
      await resumeApp()
      exporting.value = false
    }
    notify.success({})
    return true
  }

  async function generateMigrationFile() {
    const base = await appDataDir()
    const data: Migration = {
      version: config.value.version,
      base,
    }
    await writeTextFile(MIGRATION_FILENAME, JSON.stringify(data), { baseDir: BaseDirectory.AppData })
  }

  function createScheduledTask() {
    const _ = new Timer(async () => {
      const now = Date.now()
      if (now - config.value.lastExport > config.value.scheduledExportPeriod) {
        const has = await exists(config.value.scheduledExportPath)
        if (has) {
          const finished = await handleExport(config.value.scheduledExportPath)
          if (finished)
            config.value.lastExport = now
        }
      }
    }, calcDuration(1, 'hour'))
  }

  createScheduledTask()

  return {
    handleExport,
    exporting,
  }
})
