<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import { listen } from '@tauri-apps/api/event'
import { exit } from '@tauri-apps/api/process'

const { locale: l } = useI18n()
const { start } = useUpdate()
const configStore = useConfig()
const timeStore = useTime()
useMonitor()
useActivity()

const { finish } = timeStore
const { config } = storeToRefs(configStore)
const { running } = storeToRefs(timeStore)

watchOnce(() => config.value.checkUpdate, (v) => {
  if (v)
    start()
})

const locale = computed(() => {
  switch (l.value) {
    case 'zh-CN':
      return zhCN

    default:
      return enUS
  }
})

listen('quit', async () => {
  if (running.value)
    await finish()
  await exit()
})
</script>

<template>
  <a-config-provider :locale="locale">
    <nav-drawer>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </nav-drawer>
  </a-config-provider>
</template>
