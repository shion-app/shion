<script setup lang="ts">
import { ModalsContainer } from 'vue-final-modal'

import { listen } from '@tauri-apps/api/event'
import { exit } from '@tauri-apps/api/process'

const { start } = useUpdateStore()
const configStore = useConfigStore()
const timeStore = useTimerStore()
useMonitorStore()
useActivityStore()

const { finish } = timeStore
const { config } = storeToRefs(configStore)
const { running } = storeToRefs(timeStore)

watchOnce(() => config.value.checkUpdate, (v) => {
  if (v)
    start()
})

listen('quit', async () => {
  if (running.value)
    await finish()
  await exit()
})
</script>

<template>
  <v-locale-provider :locale="config.locale">
    <v-theme-provider with-background>
      <layout-provider>
        <layout-header>
          <title-bar />
        </layout-header>
        <layout-nav>
          <nav-action />
        </layout-nav>
        <layout-main>
          <router-view v-slot="{ Component }">
            <component :is="Component" />
          </router-view>
        </layout-main>
        <layout-footer />
      </layout-provider>
      <ModalsContainer />
      <notification-container />
    </v-theme-provider>
  </v-locale-provider>
</template>
