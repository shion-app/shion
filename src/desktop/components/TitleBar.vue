<script setup lang="ts">
import { getCurrent } from '@tauri-apps/api/window'
import { appLogDir } from '@tauri-apps/api/path'
import { core } from '@tauri-apps/api'
import { attachConsole } from '@tauri-apps/plugin-log'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-shell'

import logo from '@/assets/logo.svg'

const setting = ref(false)
// const sync = ref(false)
const history = ref(false)
const about = ref(false)
const importExport = ref(false)

const dialogStore = useDialogStore()
const configStore = useConfigStore()
const changelogStore = useChangelogStore()
const { dialog } = storeToRefs(dialogStore)
const { config } = storeToRefs(configStore)
const { dialog: changelog } = storeToRefs(changelogStore)

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
  invoke('open_devtools')
}

function jumpToDocument() {
  const url = config.value.locale == 'zh-CN' ? 'https://shion.app/zh/guide/general' : 'https://shion.app/guide/general'
  open(url)
}

useHotkey('ctrl+shift+i', openDevtools)
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
          <v-list-item value="titleBar.view.history" :title="$t('titleBar.view.history')" @click="history = true" />
          <v-list-item
            value="titleBar.view.importExport" :title="$t('titleBar.view.importExport')"
            @click="importExport = true"
          />
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
          <v-list-item value="titleBar.help.tour" :title="$t('titleBar.help.tour')" @click="config.tour = true" />
          <v-list-item
            value="titleBar.help.changelog" :title="$t('titleBar.help.changelog')"
            @click="changelog = true"
          />
          <v-divider my-1 />
          <v-list-item value="titleBar.help.log" :title="$t('titleBar.help.log')" @click="openLogDir" />
          <v-list-item value="titleBar.help.devtools" :title="$t('titleBar.help.devtools')" @click="openDevtools" />
          <v-divider my-1 />
          <v-list-item value="titleBar.help.problem" :title="$t('titleBar.help.problem')" @click="jumpToDocument">
            <template #append>
              <div i-mdi:link-variant text-4 />
            </template>
          </v-list-item>
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
      <v-btn variant="text" class="hover:bg-red hover:text-white" @click="() => currentWindow.hide()">
        <div i-mdi:close />
      </v-btn>
    </div>
    <setting-dialog v-model:visible="setting" />
    <about-dialog v-model:visible="about" />
    <!-- <sync-dialog v-model:visible="sync" /> -->
    <history-dialog v-model:visible="history" />
    <import-export-dialog v-model:visible="importExport" />
    <changelog-dialog v-model:visible="changelog" />
  </div>
</template>
