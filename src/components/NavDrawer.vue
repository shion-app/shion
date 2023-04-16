<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

const menu = computed(() => [{
  icon: 'i-mdi:view-grid',
  key: 'index',
  tip: t('nav.plan'),
  to: '/',
}, {
  icon: 'i-mdi:clock',
  key: 'time',
  tip: t('nav.time'),
  to: '/time',
}, {
  icon: 'i-mdi:label',
  key: 'label',
  tip: t('nav.label'),
  to: '/label',
}, {
  icon: 'i-mdi:cog',
  key: 'config',
  tip: t('nav.config'),
  to: '/config',
}])

const name = computed(() => route.name as string)
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider collapsed :trigger="null" theme="light">
      <a-menu :selected-keys="[name]">
        <a-menu-item v-for="{ key, icon, tip, to } in menu" :key="key">
          <template #icon>
            <div text-8 :class="icon" />
          </template>
          <router-link :to="to">
            {{ tip }}
          </router-link>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <slot />
    </a-layout>
  </a-layout>
</template>
