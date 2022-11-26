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
}

type InputConfirmOptions = Omit<ConfirmOptions, 'resolve' | 'type'>

export interface MessageOptions extends DialogOptions {
  type: 'message'
  closed: boolean
  timeout?: number
}

type InputMessageOptions = Omit<MessageOptions, 'resolve' | 'type' | 'closed'>

export type DialogProps<T extends DialogOptions = DialogOptions> = {
  id: string
  modelValue: boolean
  ok: boolean
} & T

export const useDialogStore = defineStore('dialog', () => {
  const list = ref<Array<DialogProps>>([])

  function add(options: DialogOptions) {
    const id = nanoid()
    const props: DialogProps = {
      id,
      modelValue: true,
      ok: true,
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

  const confirm = (options: InputConfirmOptions) => {
    return new Promise((resolve) => {
      const id = store.confirm({
        type: 'confirm',
        resolve,
        ...options,
      })
      list.push(id)
    })
  }

  const message = (options: InputMessageOptions) => {
    return new Promise((resolve) => {
      const id = store.message({
        type: 'message',
        width: 'fit-content',
        closed: false,
        resolve,
        ...options,
      })
      const timeout = options.timeout || 4000
      list.push(id)
      setTimeout(() => {
        store.update(id, {
          closed: true,
        })
      }, timeout)
    })
  }

  return {
    confirm,
    message,
  }
}
