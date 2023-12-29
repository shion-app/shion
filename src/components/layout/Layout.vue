<script setup lang="ts">
const { xs, sm } = useTailwindBreakpoints()
const { t } = useI18n()

const menu = computed(() => [
  {
    icon: 'i-mdi:eye-outline',
    activeIcon: 'i-mdi:eye',
    name: t('nav.overview'),
    to: '/',
    visible: true,
  },
  {
    icon: 'i-mdi:timeline-text-outline',
    activeIcon: 'i-mdi:timeline-text',
    name: t('nav.timeline'),
    to: '/timeline',
    visible: true,
  },
  {
    icon: 'i-mdi:list-box-outline',
    activeIcon: 'i-mdi:list-box',
    name: t('nav.plan'),
    to: '/plan',
    visible: sm.value,
  },
  {
    icon: 'i-mdi:label-outline',
    activeIcon: 'i-mdi:label',
    name: t('nav.label'),
    to: '/label',
    visible: sm.value,
  },
  {
    icon: 'i-mdi:timer-outline',
    activeIcon: 'i-mdi:timer',
    name: t('nav.time'),
    to: '/timer',
    visible: sm.value,
  },
  {
    icon: 'i-mdi:application-brackets-outline',
    activeIcon: 'i-mdi:application-brackets',
    name: t('nav.monitor'),
    to: '/monitor',
    visible: sm.value,
  },
  {
    icon: 'i-mdi:lightning-bolt-outline',
    activeIcon: 'i-mdi:lightning-bolt',
    name: t('nav.moment'),
    to: '/moment',
    visible: sm.value,
  },
  {
    icon: 'i-mdi:view-grid-plus-outline',
    activeIcon: 'i-mdi:view-grid-plus',
    name: t('nav.list'),
    to: '/list',
    visible: xs.value,
  },
  {
    icon: 'i-mdi:account-outline',
    activeIcon: 'i-mdi:account',
    name: t('nav.account'),
    to: '/account',
    visible: isMobile,
  },
].filter(({ visible }) => visible))
</script>

<template>
  <layout-provider>
    <layout-header>
      <title-bar />
    </layout-header>
    <layout-nav v-if="sm">
      <nav-action :menu="menu">
        <more-menu-button v-if="isDesktop" />
      </nav-action>
    </layout-nav>
    <layout-main>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
      <more-menu-fab v-if="isMobile" />
    </layout-main>
    <layout-footer>
      <nav-action v-if="xs" :vertical="false" nav-text :menu="menu" />
      <status-bar v-else />
    </layout-footer>
  </layout-provider>
</template>
