<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { error } from '@tauri-apps/plugin-log'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)
const notify = useNotify()

const importing = ref(false)
const exporting = ref(false)

async function handleImport() {
  const selected = await open()
  if (!selected)
    return

  const dest = await appDataDir()
  importing.value = true
  await suspendApp()
  try {
    await invoke('decompress', {
      target: selected.path,
      dest,
    })
  }
  catch (e) {
    error(`export error:${e}`)
    notify.error({
      text: e as any,
    })
    return
  }
  finally {
    await resumeApp()
    importing.value = false
  }
  notify.success({})
}

async function handleExport() {
  const selected = await open({
    directory: true,
  })
  if (!selected)
    return

  const dest = await join(selected, `shion-${new Date().getTime()}.zip`)

  const appDataDirPath = await appDataDir()
  exporting.value = true
  await suspendApp()
  try {
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
    return
  }
  finally {
    await resumeApp()
    exporting.value = false
  }
  notify.success({})
}
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.importExport')">
    <v-card-text>
      <div>{{ $t('importExport.tip') }}</div>
      <div space-x-4 my-4>
        <v-btn :loading="importing" @click="handleImport">
          {{ $t('importExport.import') }}
        </v-btn>
        <v-btn :loading="exporting" @click="handleExport">
          {{ $t('importExport.export') }}
        </v-btn>
      </div>
    </v-card-text>
  </advanced-dialog>
</template>
