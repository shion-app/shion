<script setup lang="ts">
import { appWindow } from '@tauri-apps/api/window'

import logo from '@/assets/logo.png'
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
          <v-list-item value="titleBar.view.setting">
            <v-list-item-title>
              {{ $t('titleBar.view.setting') }}
            </v-list-item-title>
            <setting-dialog />
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <div>
      <v-btn variant="text" @click="() => appWindow.minimize()">
        <div i-mdi:window-minimize />
      </v-btn>
      <v-btn variant="text" :disabled="true">
        <div i-mdi:window-maximize />
      </v-btn>
      <v-btn variant="text" @click="() => appWindow.hide()">
        <div i-mdi:close />
      </v-btn>
    </div>
  </div>
</template>
