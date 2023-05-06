<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const store = useMore()

const { menu: moreMenu } = storeToRefs(store)
const { handler: handleMenuClick } = store

const menu = computed(() => [{
  icon: 'i-mdi:view-grid',
  key: 'index',
  tip: t('nav.plan'),
  to: '/',
}, {
  icon: 'i-mdi:label',
  key: 'label',
  tip: t('nav.label'),
  to: '/label',
}, {
  icon: 'i-mdi:clock',
  key: 'time',
  tip: t('nav.time'),
  to: '/time',
}, {
  icon: 'i-mdi:cog',
  key: 'config',
  tip: t('nav.config'),
  to: '/config',
}])

const name = computed(() => route.name as string)
</script>

<template>
  <a-layout h-screen>
    <a-layout-sider collapsed :trigger="null" theme="light" collapsed-width="60">
      <a-menu :selected-keys="[name]" flex flex-col h-full space-y-1 @click="handleMenuClick">
        <a-menu-item v-for="{ key, icon, tip, to } in menu" :key="key">
          <template #icon>
            <div :class="icon" scale-150 />
          </template>
          <router-link :to="to">
            {{ tip }}
          </router-link>
        </a-menu-item>
        <div flex-1 />
        <sub-menu v-if="moreMenu.children?.length" :menu="moreMenu" />
      </a-menu>
    </a-layout-sider>
    <a-layout overflow-y-auto>
      <slot />
    </a-layout>
  </a-layout>
</template>
