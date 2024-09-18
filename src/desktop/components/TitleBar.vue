<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'
import { appLogDir } from '@tauri-apps/api/path'
import { attachConsole } from '@tauri-apps/plugin-log'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-shell'
import { StateFlags, saveWindowState } from '@tauri-apps/plugin-window-state'

import logo from '@/assets/logo.svg'

const setting = ref(false)
// const sync = ref(false)
const history = ref(false)
const about = ref(false)
const importExport = ref(false)
const extension = ref(false)

const isMaximized = ref(false)

const dialogStore = useDialogStore()
const configStore = useConfigStore()
const changelogStore = useChangelogStore()
const { dialog } = storeToRefs(dialogStore)
const { config } = storeToRefs(configStore)
const { dialog: changelog } = storeToRefs(changelogStore)

const currentWindow = getCurrentWindow()

if (isProd)
  attachConsole()

async function openLogDir() {
  const appLogDirPath = await appLogDir()
  await open(appLogDirPath)
}

function openDevtools() {
  invoke('open_devtools')
}

function jumpToDocument() {
  const url = config.value.locale == 'zh-CN' ? 'https://shion.app/zh/guide/general' : 'https://shion.app/guide/general'
  open(url)
}

function openEarlyAccess() {
  const url = config.value.locale == 'zh-CN' ? 'https://shion.app/zh/guide/early-access' : 'https://shion.app/guide/early-access'
  open(url)
}

function openXiaohongshu() {
  open('https://www.xiaohongshu.com/user/profile/66440a7e0000000007004206')
}

async function toggleMaximize() {
  if (isMaximized.value)
    await currentWindow.unmaximize()
  else
    await currentWindow.maximize()

  await checkIsMaximized()
}

async function checkIsMaximized() {
  isMaximized.value = await currentWindow.isMaximized()
}

function onWindowResized() {
  saveWindowState(StateFlags.ALL)
  checkIsMaximized()
}

const onDebounceWindowResized = useDebounceFn(onWindowResized)

currentWindow.onResized(onDebounceWindowResized)

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
          <v-list-item
            value="titleBar.view.extension" :title="$t('titleBar.view.extension')"
            @click="extension = true"
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
      <v-menu>
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props">
            {{ $t('titleBar.announcement.desc') }}
          </v-btn>
        </template>
        <v-list min-width="150">
          <v-list-item
            value="titleBar.announcement.earlyAccess" :title="$t('titleBar.announcement.earlyAccess')"
            @click="openEarlyAccess"
          >
            <template #append>
              <div i-mdi:link-variant text-4 />
            </template>
          </v-list-item>
          <template v-if="config.locale == 'zh-CN'">
            <v-divider my-1 />
            <v-list-item
              value="titleBar.announcement.xiaohongshu" :title="$t('titleBar.announcement.xiaohongshu')"
              @click="openXiaohongshu"
            >
              <template #append>
                <div i-mdi:link-variant text-4 />
              </template>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>
    </div>
    <div>
      <v-btn variant="text" @click="() => currentWindow.minimize()">
        <div i-mdi:window-minimize />
      </v-btn>
      <v-btn variant="text" @click="toggleMaximize">
        <div :class="isMaximized ? 'i-mdi:window-restore' : 'i-mdi:window-maximize'" />
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
    <extension-dialog v-model:visible="extension" />
  </div>
</template>
