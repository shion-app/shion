interface NavButton {
  icon: string
  activeIcon: string
  name: string
  to: string
  key: string
  children?: NavButton[]
}

export const useNavStore = defineStore('nav', () => {
  const { t } = useI18n()

  const [expanded, toggleExpanded] = useToggle()

  // @unocss-include
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
        // {
        //   icon: 'i-mdi:cloud-outline',
        //   activeIcon: 'i-mdi:cloud',
        //   name: t('nav.history'),
        //   to: '/collection/history',
        //   key: 'history',
        // },
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

  const submenu = ref<Array<NavButton>>([])

  function openSubmenu(key: string) {
    submenu.value = []
    const button = menu.value.find(i => i.key == key)
    if (!button?.children)
      return

    expanded.value = true
    submenu.value = button.children
  }

  return {
    menu,
    expanded,
    toggleExpanded,
    submenu,
    openSubmenu,
  }
})
