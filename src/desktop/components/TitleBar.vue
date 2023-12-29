<script setup lang="ts">
import { getCurrent } from '@tauri-apps/api/window'

import logo from '@/assets/logo.png'

const setting = ref(false)
const about = ref(false)

const currentWindow = getCurrent()
</script>

<template>
  <div data-tauri-drag-region flex h-full select-none justify-between items-center>
    <div flex>
      <img :src="logo" object-contain width="20" height="20" alt="logo" mx-2>
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            variant="text"
            v-bind="props"
          >
            {{ $t('titleBar.view.desc') }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item value="titleBar.view.setting" :title="$t('titleBar.view.setting')" @click="setting = true" />
        </v-list>
      </v-menu>
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            variant="text"
            v-bind="props"
          >
            {{ $t('titleBar.help.desc') }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item value="titleBar.help.about" :title="$t('titleBar.help.about')" @click="about = true" />
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
  </div>
</template>