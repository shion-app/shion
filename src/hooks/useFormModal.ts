import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'

import FormModal from '@components/modal/FormModal.vue'
import type { ComponentProps } from '@interfaces/index'

export function useFormModal(options: UseModalOptions<ComponentProps<typeof FormModal>>) {
  return useModal({
    component: FormModal,
    ...options,
  })
}
