import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'
import type { ComponentProps } from 'vue-component-type-helpers'
import mergeOptions from 'merge-options'

import ConfirmModal from '@/components/modal/ConfirmModal.vue'

type Options = UseModalOptions<ComponentProps<typeof ConfirmModal>>

export function useConfirmModal(options: Options) {
  const { toggleDialog } = useDialogStore()

  const modal = useModal({
    component: ConfirmModal,
    ...options,
  })

  const unwatch = watch(() => modal.options.modelValue, v => toggleDialog(v))

  onScopeDispose(unwatch)

  function patchOptions(attrs: Partial<Options['attrs']>) {
    const newOptions = mergeOptions(
      {
        attrs: modal.options.attrs,
      },
      {
        attrs,
      },
    )
    modal.patchOptions(newOptions)
  }

  return {
    ...modal,
    patchOptions,
  }
}

export function useConfirmDeleteModal(onConfirm: () => any) {
  const { t, locale } = useI18n()

  const modal = useConfirmModal({
    attrs: {
      title: t('modal.confirmDelete'),
      onConfirm() {
        onConfirm()
        modal.close()
      },
    },
  })

  const unwatch = watch(locale, () => {
    modal.patchOptions({
      title: t('modal.confirmDelete'),
    })
  })

  onScopeDispose(unwatch)

  return {
    open: modal.open,
  }
}
