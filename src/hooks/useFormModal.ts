import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'
import mergeOptions from 'merge-options'

import FormModal from '@/components/modal/FormModal.vue'
import type { ComponentProps } from '@/interfaces'

export type useFormModalOptions = UseModalOptions<ComponentProps<typeof FormModal>>

export function useFormModal<T>(source: (model: Partial<T>) => useFormModalOptions) {
  const model = ref({}) as Ref<Partial<T>>

  const options = mergeOptions(source(model.value), {
    attrs: {
      onFormUpdate(v: Partial<T>) {
        model.value = v
      },
      onClosed() {
        model.value = {}
      },
    },
  })

  const modal = useModal({
    component: FormModal,
    ...options,
  })

  const unwatch = watchDeep(() => source(model.value), (v) => {
    modal.patchOptions({
      attrs: v.attrs,
    })
  })

  onScopeDispose(unwatch)

  function setModelValue(values: Partial<T>) {
    const newOptions = mergeOptions(
      {
        attrs: modal.options.attrs,
      },
      {
        attrs: {
          form: {
            values,
          },
        },
      })
    nextTick(() => modal.patchOptions(newOptions))
  }

  return {
    ...modal,
    model,
    setModelValue,
  }
}
