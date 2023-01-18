<script lang="ts" setup>
import logo from '../../../build/appicon.png'

const [isMaximised, toggle] = useToggle()

function windowToggleMaximise() {
  toggle()
  WindowToggleMaximise()
}
</script>

<template>
  <v-system-bar height="36" window class="p-r-0!" style="--wails-draggable:drag">
    <img :src="logo" alt="logo" h-8 mr-2>
    <system-menu />
    <div flex-1 h-full @dblclick="windowToggleMaximise" />
    <v-btn variant="text" class="rounded-0!" @click="WindowMinimise">
      <div i-mdi:minus text-4 />
    </v-btn>
    <v-btn variant="text" class="rounded-0!" @click="windowToggleMaximise">
      <div v-if="isMaximised" i-mdi:checkbox-multiple-blank-outline text-4 />
      <div v-else i-mdi:checkbox-blank-outline text-4 />
    </v-btn>
    <v-btn variant="text" class="hover:bg-red! rounded-0!" @click="Quit">
      <div i-mdi:close text-4 />
    </v-btn>
  </v-system-bar>
</template>
