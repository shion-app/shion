<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { error } from '@tauri-apps/plugin-log'

const store = useConfigStore()

const { config } = storeToRefs(store)
const notify = useNotify()

const disabled = ref(false)
const running = ref(false)

async function restart() {
  disabled.value = true
  running.value = false
  try {
    await invoke('restart_api_service', {
      serverPort: config.value.serverPort,
    })
    await sleep(calcDuration(2, 'second'))
  }
  catch (e) {
    error(`restart service error: ${e}`)
    notify.error({
      text: e as string,
    })
    return
  }
  finally {
    disabled.value = false
    await checkStatus()
  }
  notify.success({})
}

async function checkStatus() {
  try {
    const active = await invoke<boolean>('is_api_service_active')
    running.value = active
  }
  catch {
    running.value = false
  }
}

checkStatus()
</script>

<template>
  <v-tabs-window-item value="service">
    <v-card flat>
      <v-card-text class="py-0!">
        <v-list lines="two">
          <v-list-item :disabled="true">
            <v-list-item-title>{{ $t('config.serverRunning') }}</v-list-item-title>
            <template #append>
              <v-checkbox-btn :model-value="running" />
            </template>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>{{ $t('config.serverPort') }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ $t('config.desc.restartService') }}
            </v-list-item-subtitle>

            <v-list-item-action class="mt-4 space-x-4">
              <v-number-input
                v-model="config.serverPort" :disabled="disabled" hide-details variant="outlined" reverse
                density="comfortable" class="w-[200px]" control-variant="stacked" :min="0"
              />
              <v-btn color="primary" :loading="disabled" @click="restart">
                {{ $t('config.service.restart') }}
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-tabs-window-item>
</template>
