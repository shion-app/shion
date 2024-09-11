<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { BaseDirectory, exists, readTextFile, remove } from '@tauri-apps/plugin-fs'
import { error } from '@tauri-apps/plugin-log'
import { relaunch } from '@tauri-apps/plugin-process'
import { compare } from 'compare-versions'
import { db } from '@/modules/database'
import type { Migration } from '@/stores/useExportStore'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)
const notify = useNotify()
const { t } = useI18n()

const configStore = useConfigStore()
const exportStore = useExportStore()

const { config } = storeToRefs(configStore)
const { exporting } = storeToRefs(exportStore)

const importing = ref(false)
const relaunching = ref(false)

async function handleImport() {
  const selected = await open()
  if (!selected)
    return

  const dest = await appDataDir()
  const verifyDest = await join(dest, MIGRATION_FOLDER)
  importing.value = true

  await suspendApp()
  let migration: Migration
  try {
    await invoke('decompress', {
      target: selected,
      dest: verifyDest,
    })
    migration = await verifyMigrationFile()
    await remove(verifyDest, {
      recursive: true,
    })
    await invoke('decompress', {
      target: selected,
      dest,
    })
  }
  catch (e) {
    error(`import error:${e}`)
    notify.error({
      text: e as any,
    })
    importing.value = false
    return
  }
  finally {
    await resumeApp()
  }
  await updateAssetPath(migration.base)
  importing.value = false
  notify.success({})
  visibleVModel.value = false
  relaunching.value = true
  await sleep(3000)
  await relaunch()
}

async function handleExport() {
  const selected = await open({
    directory: true,
  })
  if (!selected)
    return

  await exportStore.handleExport(selected)
}

async function verifyMigrationFile() {
  const file = `${MIGRATION_FOLDER}/${MIGRATION_FILENAME}`
  const has = await exists(file, { baseDir: BaseDirectory.AppData })
  if (!has)
    throw t('importExport.verify.noMigration')

  const migration: Migration = JSON.parse(await readTextFile(file, { baseDir: BaseDirectory.AppData }))

  if (compare(migration.version, config.value.version, '>')) {
    throw t('importExport.verify.version', {
      source: migration.version,
      version: config.value.version,
    })
  }

  return migration
}

async function updateAssetPath(base: string) {
  const dir = await appDataDir()
  if (base == dir)
    return

  const source = encodeURIComponent(base)
  const target = encodeURIComponent(dir)
  db.execute(`UPDATE program set icon = REPLACE(icon, '${source}', '${target}')`)
  db.execute(`UPDATE moment set content = REPLACE(content, '${source}', '${target}')`)
}
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.importExport')">
    <v-card-text>
      <div>{{ $t('importExport.tip') }}</div>
    </v-card-text>
    <v-card-actions>
      <v-btn :loading="importing" color="primary" @click="handleImport">
        {{ $t('importExport.import') }}
      </v-btn>
      <v-btn :loading="exporting" color="primary" @click="handleExport">
        {{ $t('importExport.export') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
  <advanced-dialog :visible="relaunching" :title="$t('modal.prompt')" persistent>
    <v-card-text mb-4>
      {{ $t('importExport.relaunch') }}
    </v-card-text>
  </advanced-dialog>
</template>
