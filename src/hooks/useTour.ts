import { driver } from 'driver.js'

export function useTour() {
  const configStore = useConfigStore()
  const navStore = useNavStore()
  const { t } = useI18n()
  const router = useRouter()

  const { config, ready } = storeToRefs(configStore)
  const { openSubmenu, toggleExpanded } = navStore

  function start() {
    const tour = driver({
      showProgress: true,
      doneBtnText: t('tour.doneBtnText'),
      nextBtnText: t('tour.nextBtnText'),
      prevBtnText: t('tour.prevBtnText'),
      onDestroyed: () => {
        config.value.tour = false
      },
      steps: [
        {
          popover: {
            title: t('tour.step1.title'),
            description: t('tour.step1.description'),
            onNextClick: async () => {
              await router.push('/')
              tour.moveNext()
            },
          },
        },
        {
          element: '#nav',
          popover: {
            title: t('tour.step2.title'),
            description: t('tour.step2.description'),
          },
        },
        {
          element: '#more-menu',
          popover: {
            title: t('tour.step3.title'),
            description: t('tour.step3.description'),
          },
        },
        {
          element: '#nav-overview',
          popover: {
            title: t('tour.step4.title'),
            description: t('tour.step4.description'),
            onNextClick: async () => {
              await router.push('/timeline')
              tour.moveNext()
            },
          },
        },
        {
          element: '#nav-timeline',
          popover: {
            title: t('tour.step5.title'),
            description: t('tour.step5.description'),
            onNextClick: async () => {
              toggleExpanded()
              openSubmenu('collection')
              await router.push('/collection/plan')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#nav-plan',
          popover: {
            title: t('tour.step6.title'),
            description: t('tour.step6.description'),
            onNextClick: async () => {
              await router.push('/collection/label')
              tour.moveNext()
            },
            onPrevClick: async () => {
              toggleExpanded()
              await router.push('/timeline')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#nav-label',
          popover: {
            title: t('tour.step7.title'),
            description: t('tour.step7.description'),
            onNextClick: async () => {
              await router.push('/collection/monitor')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/collection/plan')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#nav-monitor',
          popover: {
            title: t('tour.step9.title'),
            description: t('tour.step9.description'),
            onNextClick: async () => {
              await router.push('/collection/box')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/collection/label')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#nav-box',
          popover: {
            title: t('tour.step10.title'),
            description: t('tour.step10.description'),
            onNextClick: async () => {
              openSubmenu('record')
              await router.push('/record/timer')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/collection/monitor')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#nav-timer',
          popover: {
            title: t('tour.step8.title'),
            description: t('tour.step8.description'),
            onNextClick: async () => {
              await router.push('/record/moment')
              tour.moveNext()
            },
            onPrevClick: async () => {
              openSubmenu('collection')
              await router.push('/collection/box')
              tour.movePrevious()
            },
          },
        },

        {
          element: '#nav-moment',
          popover: {
            title: t('tour.step11.title'),
            description: t('tour.step11.description'),
            onNextClick: async () => {
              toggleExpanded()
              await router.push('/')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/record/timer')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#footer',
          popover: {
            title: t('tour.step12.title'),
            description: t('tour.step12.description'),
            align: 'end',
            onPrevClick: async () => {
              toggleExpanded()
              openSubmenu('record')
              await router.push('/record/moment')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#header',
          popover: {
            title: t('tour.step13.title'),
            description: t('tour.step13.description'),
          },
        },
        {
          popover: {
            title: t('tour.step14.title'),
            description: t('tour.step14.description'),
          },
        },
      ],
    })
    tour.drive()
  }

  whenever(() => ready.value && config.value.tour, start)
}
