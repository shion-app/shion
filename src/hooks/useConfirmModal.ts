import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'
import type { ComponentProps } from 'vue-component-type-helpers'
import mergeOptions from 'merge-options'

import ConfirmModal from '@/components/modal/ConfirmModal.vue'

export function useConfirmModal(options: UseModalOptions<ComponentProps<typeof ConfirmModal>>) {
  return useModal({
    component: ConfirmModal,
    ...options,
  })
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
    const newOptions = mergeOptions(
      {
        attrs: modal.options.attrs,
      },
      {
        attrs: {
          title: t('modal.confirmDelete'),
        },
      },
    )
    modal.patchOptions(newOptions)
  })

  onScopeDispose(unwatch)

  return {
    open: modal.open,
  }
}
