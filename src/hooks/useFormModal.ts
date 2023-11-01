import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'

import FormModal from '@/components/modal/FormModal.vue'
import type { ComponentProps } from '@/interfaces'

export type useFormModalOptions = UseModalOptions<ComponentProps<typeof FormModal>>

export function useFormModal(options: Ref<useFormModalOptions>) {
  const modal = useModal({
    component: FormModal,
    ...options.value,
  })

  const unwatch = watchDeep(options, modal.patchOptions)

  onScopeDispose(unwatch)

  return {
    ...modal,
    open: () => nextTick(modal.open),
  }
}
