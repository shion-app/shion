<script setup lang="ts">
import { ModalsContainer } from 'vue-final-modal'

import { db } from './modules/database'

if (isDesktop)
  useUpdateStore()

useTimerStore()
useMonitorStore()
useActivityStore()
const configStore = useConfigStore()

const { config } = storeToRefs(configStore)

const app = useApplication()

app.addCloseHook(() => db.close())
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
