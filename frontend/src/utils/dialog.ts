import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

// vuetify\src\composables\dimensions.ts
interface DimensionProps {
  height?: number | string
  maxHeight?: number | string
  maxWidth?: number | string
  minHeight?: number | string
  minWidth?: number | string
  width?: number | string
}

export const dimensionKey = ['height', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'width']

interface DialogOptions extends DimensionProps {
  type: 'confirm' | 'message'
  content: string
  resolve: (ok: boolean) => void
}

export interface ConfirmOptions extends DialogOptions {
  type: 'confirm'
  title?: string
  active: boolean
  ok: boolean
}

type InputConfirmOptions = Omit<ConfirmOptions, 'resolve' | 'type' | 'active' | 'ok'>

export interface MessageOptions extends DialogOptions {
  type: 'message'
  closed: boolean
  timeout?: number
  status: 'success' | 'loading'
  process?: Promise<unknown>
}

type InputMessageOptions = Omit<MessageOptions, 'resolve' | 'type' | 'closed'>

type InputSuccessMessageOptions = Omit<InputMessageOptions, 'status' | 'process'>

type InputLoadingMessageOptions = Omit<InputMessageOptions, 'status'>

export type DialogProps<T extends DialogOptions = DialogOptions> = {
  id: string
} & T

export const useDialogStore = defineStore('dialog', () => {
  const list = ref<Array<DialogProps>>([])

  function add(options: DialogOptions) {
    const id = nanoid()
    const props: DialogProps = {
      id,
      ...options,
    }
    list.value.push(props)
    return id
  }

  function remove(id: string) {
    removeBy(list.value, item => item.id === id)
  }

  function confirm(options: ConfirmOptions) {
    return add(options)
  }

  function message(options: MessageOptions) {
    return add(options)
  }

  function update(id: string, value) {
    const dialog = list.value.find(item => item.id === id)
    if (!dialog)
      return
    Object.assign(dialog, value)
  }

  return { list, confirm, remove, message, update }
})

export function useDialog() {
  const store = useDialogStore()

  const list: string[] = []

  onScopeDispose(() => {
    list.forEach(id => store.remove(id))
  })

  function confirm(options: InputConfirmOptions) {
    return new Promise<boolean>((resolve) => {
      const id = store.confirm({
        type: 'confirm',
        active: true,
        ok: true,
        resolve,
        ...options,
      })
      list.push(id)
    })
  }

  function message(options: InputMessageOptions) {
    return new Promise<boolean>((resolve) => {
      const id = store.message({
        type: 'message',
        width: 'fit-content',
        closed: false,
        resolve,
        ...options,
      })
      list.push(id)

      function close() {
        const timeout = options.timeout || 2000
        setTimeout(() => {
          store.update(id, {
            closed: true,
          })
        }, timeout)
      }

      waitProcess(() => options.process?.then(() => {
        store.update(id, {
          status: 'success',
        })
      }), 0).then(close)
    })
  }

  message.success = function (options: InputSuccessMessageOptions) {
    return message({
      status: 'success',
      ...options,
    })
  }

  message.loading = function (options: InputLoadingMessageOptions) {
    return message({
      status: 'loading',
      ...options,
    })
  }

  return {
    confirm,
    message,
  }
}
