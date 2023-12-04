import type { UseModalOptions } from 'vue-final-modal'
import { useModal } from 'vue-final-modal'
import mergeOptions from 'merge-options'

import FormModal from '@/components/modal/FormModal.vue'
import type { ComponentProps } from '@/interfaces'

type ModalProps = ComponentProps<typeof FormModal>
export type useFormModalOptions = UseModalOptions<ModalProps>

class ModalPromise {
  #promise?: Promise<void>
  #resolve?: () => void
  #reject?: () => void

  async open() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })
    return this.#promise
  }

  resolve() {
    const resolve = this.#resolve

    this.#promise = undefined
    this.#resolve = undefined
    this.#reject = undefined

    resolve?.()
  }

  reject() {
    const reject = this.#reject

    this.#promise = undefined
    this.#resolve = undefined
    this.#reject = undefined

    reject?.()
  }
}

export function useFormModal<T>(source: (model: Partial<T>) => useFormModalOptions) {
  const model = ref({}) as Ref<Partial<T>>

  const promise = new ModalPromise()

  const options = mergeOptions(source(model.value), {
    attrs: {
      onFormUpdate(v: Partial<T>) {
        model.value = v
      },
      onClosed() {
        model.value = {}
      },
      onAfterConfirm() {
        promise.resolve()
      },
      onAfterCancel() {
        promise.reject()
      },
    },
  })

  const modal = useModal<ModalProps>({
    component: FormModal,
    ...options,
  })

  async function open() {
    await modal.open()
    await promise.open()
  }

  const unwatch = watchDeep(() => source(model.value), (v) => {
    const values = modal.options.attrs?.form.values
    if (Object.keys(values || {}).length > 0) {
      for (const key in values) {
        if (values[key] != model.value[key])
          return
      }
    }

    const newOptions = mergeOptions(
      {
        attrs: modal.options.attrs,
      },
      {
        attrs: v.attrs,
      },
    )

    newOptions.attrs.form.values = {}

    modal.patchOptions(newOptions)
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
      },
    )
    modal.patchOptions(newOptions)
  }

  return {
    ...modal,
    open,
    model,
    setModelValue,
  }
}
