<script setup lang="ts">
import { appWindow } from '@tauri-apps/api/window'

import logo from '@/assets/logo.png'
</script>

<template>
  <div data-tauri-drag-region flex h-full select-none justify-between items-center>
    <img :src="logo" width="16" height="16" alt="logo" ml-2>
    <div>
      <v-btn variant="text" size="small" @click="() => appWindow.minimize()">
        <div i-mdi:window-minimize />
      </v-btn>
      <v-btn variant="text" :disabled="true" size="small">
        <div i-mdi:window-maximize />
      </v-btn>
      <v-btn variant="text" size="small" @click="() => appWindow.hide()">
        <div i-mdi:close />
      </v-btn>
    </div>
  </div>
</template>

<style>
</style>
