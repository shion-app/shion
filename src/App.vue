<script setup lang="ts">
import { ModalsContainer } from 'vue-final-modal'

if (isDesktop)
  useUpdateStore()

useTimerStore()
useMonitorStore()
useActivityStore()
const configStore = useConfigStore()

const { config } = storeToRefs(configStore)

useTour()
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
