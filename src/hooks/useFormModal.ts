import { useModal } from 'vue-final-modal'
import FormModal from '@components/modal/FormModal.vue'

export function useFormModal(options: Parameters<typeof useModal>[0]) {
  return useModal({
    component: FormModal,
    ...options,
  })
}
