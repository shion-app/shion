import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'

import FormModal from '@/components/modal/FormModal.vue'
import type { ComponentProps } from '@/interfaces'

export type useFormModalOptions = UseModalOptions<ComponentProps<typeof FormModal>>

export function useFormModal(options: useFormModalOptions) {
  return useModal({
    component: FormModal,
    ...options,
  })
}
