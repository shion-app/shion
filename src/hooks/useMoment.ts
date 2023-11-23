export function useMoment() {
  const { t } = useI18n()
  const router = useRouter()
  const { success, error } = useNotify()
  const { getI18nMessage, isUniqueError } = useDatabase()

  const editSuccess = ref(false)

  function onEditGuard(hasChanged: Ref<boolean>) {
    onBeforeRouteLeave((to, from, next) => {
      if (hasChanged.value && !editSuccess.value) {
        const { open, close } = useConfirmModal({
          attrs: {
            title: t('moment.tip.notSave'),
            async onConfirm() {
              close()
              next()
            },
          },
        })
        open()
      }
      else {
        next()
      }
    })
  }

  async function submit(title: Ref<string>, request: () => Promise<unknown>) {
    if (!title.value) {
      return error({
        text: t('moment.tip.emptyTitle'),
      })
    }
    try {
      await request()
    }
    catch (e) {
      if (isUniqueError(e)) {
        return error({
          text: t('moment.tip.duplicateTitle'),
        })
      }
      return error({
        text: getI18nMessage(e),
      })
    }

    success({})
    editSuccess.value = true
    router.push('/moment')
  }

  return {
    onEditGuard,
    submit,
  }
}
