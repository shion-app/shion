import { useModal } from 'vue-final-modal'
import ConfirmModal from '@components/modal/ConfirmModal.vue'

export function useConfirmModal(options: Parameters<typeof useModal>[0]) {
  return useModal({
    component: ConfirmModal,
    ...options,
  })
}
