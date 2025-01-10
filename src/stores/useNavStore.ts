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
      icon: 'i-mdi:timeline-outline',
      activeIcon: 'i-mdi:timeline',
      name: t('nav.timeblock'),
      to: '/timeblock',
      key: 'timeblock',
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
        // {
        //   icon: 'i-mdi:cloud-outline',
        //   activeIcon: 'i-mdi:cloud',
        //   name: t('nav.history'),
        //   to: '/collection/history',
        //   key: 'history',
        // },
        {
          icon: 'i-mdi:shape-outline',
          activeIcon: 'i-mdi:shape',
          name: t('nav.dimension'),
          to: '/collection/dimension',
          key: 'dimension',
        },
      ],
    },
    {
      icon: 'i-mdi:timer-outline',
      activeIcon: 'i-mdi:timer',
      to: '/timer',
      name: t('nav.record'),
      key: 'timer',
    },
  ])

  const submenu = ref<Array<NavButton>>([])

  function openSubmenu(key: string) {
    const button = menu.value.find(i => i.key == key)
    expanded.value = !!button?.children?.length
    submenu.value = button?.children || []
  }

  return {
    menu,
    expanded,
    toggleExpanded,
    submenu,
    openSubmenu,
  }
})
