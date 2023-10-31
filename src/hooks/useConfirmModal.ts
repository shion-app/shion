import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'

import ConfirmModal from '@/components/modal/ConfirmModal.vue'
import type { ComponentProps } from '@/interfaces'

export function useFormModal(options: UseModalOptions<ComponentProps<typeof ConfirmModal>>) {
  return useModal({
    component: ConfirmModal,
    ...options,
  })
}
