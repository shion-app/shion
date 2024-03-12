import { driver } from 'driver.js'

export function useTour() {
  const store = useConfigStore()
  const { t } = useI18n()
  const router = useRouter()

  const { config, ready } = storeToRefs(store)

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
          element: '#overview',
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
          element: '#timeline',
          popover: {
            title: t('tour.step5.title'),
            description: t('tour.step5.description'),
            onNextClick: async () => {
              await router.push('/plan')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#plan',
          popover: {
            title: t('tour.step6.title'),
            description: t('tour.step6.description'),
            onNextClick: async () => {
              await router.push('/label')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/timeline')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#label',
          popover: {
            title: t('tour.step7.title'),
            description: t('tour.step7.description'),
            onNextClick: async () => {
              await router.push('/timer')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/plan')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#timer',
          popover: {
            title: t('tour.step8.title'),
            description: t('tour.step8.description'),
            onNextClick: async () => {
              await router.push('/monitor')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/label')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#monitor',
          popover: {
            title: t('tour.step9.title'),
            description: t('tour.step9.description'),
            onNextClick: async () => {
              await router.push('/box')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/timer')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#box',
          popover: {
            title: t('tour.step10.title'),
            description: t('tour.step10.description'),
            onNextClick: async () => {
              await router.push('/moment')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/monitor')
              tour.movePrevious()
            },
          },
        },
        {
          element: '#moment',
          popover: {
            title: t('tour.step11.title'),
            description: t('tour.step11.description'),
            onNextClick: async () => {
              await router.push('/')
              tour.moveNext()
            },
            onPrevClick: async () => {
              await router.push('/box')
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
              await router.push('/moment')
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
