<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'

const { locale: l } = useI18n()
const { start } = useUpdate()
const store = useConfig()

const { config } = storeToRefs(store)

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
