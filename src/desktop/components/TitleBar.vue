<script setup lang="ts">
import { getCurrent } from '@tauri-apps/api/window'
import { appLogDir } from '@tauri-apps/api/path'
import { core } from '@tauri-apps/api'
import { attachConsole } from '@tauri-apps/plugin-log'

import logo from '@/assets/logo.svg'

const setting = ref(false)
// const sync = ref(false)
const about = ref(false)

const dialogStore = useDialogStore()
const { dialog } = storeToRefs(dialogStore)

const currentWindow = getCurrent()

if (isProd)
  attachConsole()

async function openLogDir() {
  const appLogDirPath = await appLogDir()
  core.invoke('open_folder', {
    path: appLogDirPath,
  })
}

function openDevtools() {
  core.invoke('open_devtools')
}
</script>

<template>
  <div v-if="dialog" data-tauri-drag-region absolute z-10000 inset-0 />
  <div data-tauri-drag-region flex h-full select-none justify-between items-center>
    <div flex>
      <img :src="logo" object-contain width="20" height="20" alt="logo" mx-4>
      <v-menu>
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props">
            {{ $t('titleBar.view.desc') }}
          </v-btn>
        </template>
        <v-list min-width="150">
          <v-list-item value="titleBar.view.setting" :title="$t('titleBar.view.setting')" @click="setting = true" />
          <!-- <v-list-item v-if="isDev" value="titleBar.view.sync" :title="$t('titleBar.view.sync')" @click="sync = true" /> -->
        </v-list>
      </v-menu>
      <v-menu>
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props">
            {{ $t('titleBar.help.desc') }}
          </v-btn>
        </template>
        <v-list min-width="150">
          <v-list-item value="titleBar.help.about" :title="$t('titleBar.help.about')" @click="about = true" />
          <v-list-item value="titleBar.help.log" :title="$t('titleBar.help.log')" @click="openLogDir" />
          <v-list-item value="titleBar.help.devtools" :title="$t('titleBar.help.devtools')" @click="openDevtools" />
        </v-list>
      </v-menu>
    </div>
    <div>
      <v-btn variant="text" @click="() => currentWindow.minimize()">
        <div i-mdi:window-minimize />
      </v-btn>
      <v-btn variant="text" :disabled="true">
        <div i-mdi:window-maximize />
      </v-btn>
      <v-btn variant="text" @click="() => currentWindow.hide()">
        <div i-mdi:close />
      </v-btn>
    </div>
    <setting-dialog v-model:visible="setting" />
    <about-dialog v-model:visible="about" />
    <!-- <sync-dialog v-model:visible="sync" /> -->
  </div>
</template>
