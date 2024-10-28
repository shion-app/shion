import { driver } from 'driver.js'

export function useTour() {
  const configStore = useConfigStore()
  const { t } = useI18n()
  const router = useRouter()

  const { config, ready } = storeToRefs(configStore)

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
          },
        },
        {
          popover: {
            title: t('tour.step1-1.title'),
            description: t('tour.step1-1.description'),
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
          element: '#footer',
          popover: {
            title: t('tour.step14.title'),
            description: t('tour.step14.description'),
            align: 'end',
          },
        },
        {
          element: '#header',
          popover: {
            title: t('tour.step15.title'),
            description: t('tour.step15.description'),
          },
        },
        {
          popover: {
            title: t('tour.step16.title'),
            description: t('tour.step16.description'),
          },
        },
      ],
    })
    tour.drive()
  }

  whenever(() => ready.value && config.value.tour, start)
}
