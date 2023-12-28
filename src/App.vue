<script setup lang="ts">
import { ModalsContainer } from 'vue-final-modal'

useTimerStore()
useUpdateStore()
useMonitorStore()
useActivityStore()
const configStore = useConfigStore()

const { config } = storeToRefs(configStore)
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
        <layout-footer>
          <status-bar />
        </layout-footer>
      </layout-provider>
      <ModalsContainer />
      <notification-container />
    </v-theme-provider>
  </v-locale-provider>
</template>
