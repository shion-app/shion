import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'
import type { ComponentProps } from 'vue-component-type-helpers'

import ConfirmModal from '@/components/modal/ConfirmModal.vue'

export function useConfirmModal(options: UseModalOptions<ComponentProps<typeof ConfirmModal>>) {
  return useModal({
    component: ConfirmModal,
    ...options,
  })
}
