import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'
import type { ComponentProps } from 'vue-component-type-helpers'
import mergeOptions from 'merge-options'

import ConfirmModal from '@/components/modal/ConfirmModal.vue'

type Options = UseModalOptions<ComponentProps<typeof ConfirmModal>>

export function useConfirmModal() {
  const { t } = useI18n()
  const { toggleDialog } = useDialogStore()

  const modal = useModal({
    component: ConfirmModal,
  })

  const unwatch = watch(() => modal.options.modelValue, v => toggleDialog(v))

  onScopeDispose(() => {
    toggleDialog(false)
    unwatch()
  })

  function require(attrs: Partial<Options['attrs']>) {
    const newOptions = mergeOptions(
      {
        attrs: modal.options.attrs,
      },
      {
        attrs,
      },
      {
        attrs: {
          onConfirm: async () => {
            if (attrs?.onConfirm)
              await attrs.onConfirm()

            modal.close()
          },
        },
      },
    )
    modal.patchOptions(newOptions)
    modal.open()
  }

  return {
    close: modal.close,
    require,
    delete: (attrs: Partial<Options['attrs']>) => {
      require({
        title: t('modal.confirmDelete'),
        ...attrs,
      })
    },
  }
}
