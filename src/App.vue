<script setup lang="ts">
import { ModalsContainer } from 'vue-final-modal'

import { checkTrayExists } from './modules/tray'

if (isDesktop)
  useUpdateStore()

useTimerStore()
useMonitorStore()
useActivityStore()
const configStore = useConfigStore()

const { config } = storeToRefs(configStore)

useTour()
checkTrayExists()

useHotkey('*', (keyboardEvent) => {
  const disableKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']
  if (disableKeys.includes(keyboardEvent.key))
    return false

  return !keyboardEvent.ctrlKey
})
</script>

<template>
  <v-locale-provider :locale="config.locale">
    <v-theme-provider with-background>
      <layout />
      <ModalsContainer />
      <notification-container />
    </v-theme-provider>
  </v-locale-provider>
</template>
