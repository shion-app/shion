<script setup lang="ts">
import type { NavButton } from '../nav/types'

const { xs, sm } = useTailwindBreakpoints()
const { t } = useI18n()

const menu = computed<Array<NavButton>>(() => [
  {
    icon: 'i-mdi:view-dashboard-outline',
    activeIcon: 'i-mdi:view-dashboard',
    name: t('nav.overview'),
    to: '/',
    key: 'overview',
  },
  {
    icon: 'i-mdi:timeline-text-outline',
    activeIcon: 'i-mdi:timeline-text',
    name: t('nav.timeline'),
    to: '/timeline',
    key: 'timeline',
  },
  {
    icon: 'i-mdi:database-outline',
    activeIcon: 'i-mdi:database',
    to: '/collection',
    name: t('nav.collection'),
    key: 'collection',
    children: [
      {
        icon: 'i-mdi:sitemap-outline',
        activeIcon: 'i-mdi:sitemap',
        name: t('nav.plan'),
        to: '/collection/plan',
        key: 'plan',
      },
      {
        icon: 'i-mdi:label-variant-outline',
        activeIcon: 'i-mdi:label-variant',
        name: t('nav.label'),
        to: '/collection/label',
        key: 'label',
      },
      {
        icon: 'i-mdi:eye-outline',
        activeIcon: 'i-mdi:eye',
        name: t('nav.monitor'),
        to: '/collection/monitor',
        key: 'monitor',
      },
      {
        icon: 'i-mdi:cube-outline',
        activeIcon: 'i-mdi:cube',
        name: t('nav.box'),
        to: '/collection/box',
        key: 'box',
      },
      {
        icon: 'i-mdi:cloud-outline',
        activeIcon: 'i-mdi:cloud',
        name: t('nav.history'),
        to: '/collection/history',
        key: 'history',
      },
    ],
  },
  {
    icon: 'i-mdi:pencil-outline',
    activeIcon: 'i-mdi:pencil',
    to: '/record',
    name: t('nav.record'),
    key: 'record',
    children: [
      {
        icon: 'i-mdi:timer-outline',
        activeIcon: 'i-mdi:timer',
        name: t('nav.timer'),
        to: '/record/timer',
        key: 'timer',
      },

      {
        icon: 'i-mdi:lightning-bolt-outline',
        activeIcon: 'i-mdi:lightning-bolt',
        name: t('nav.moment'),
        to: '/record/moment',
        key: 'moment',
      },
    ],
  },
])
// {
//   icon: 'i-mdi:view-grid-plus-outline',
//   activeIcon: 'i-mdi:view-grid-plus',
//   name: t('nav.list'),
//   to: '/list',
//   visible: xs.value,
//   key: 'list',
// },
// {
//   icon: 'i-mdi:account-outline',
//   activeIcon: 'i-mdi:account',
//   name: t('nav.account'),
//   to: '/account',
//   visible: isMobile,
//   key: 'account',
// },
// ].filter(({ visible }) => visible))
</script>

<template>
  <layout-provider>
    <layout-header>
      <title-bar />
    </layout-header>
    <layout-nav v-if="sm">
      <nav-action :menu="menu" nav-text vertical>
        <more-menu-button v-if="isDesktop" />
      </nav-action>
    </layout-nav>
    <layout-main>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
      <div v-if="isMobile" fixed bottom-24 left-0 right-0 mx-4 flex items-center>
        <timer-float />
        <div flex-1 />
        <more-menu-fab />
      </div>
    </layout-main>
    <layout-footer>
      <nav-action v-if="xs" :menu="menu" />
      <status-bar v-else />
    </layout-footer>
  </layout-provider>
</template>
