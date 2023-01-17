import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

import type { DeepPartial } from '../interfaces'

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
}

export interface ConfirmOptions extends DialogOptions {
  type: 'confirm'
  title?: string
  active: boolean
  ok: boolean
  resolve: (ok: boolean) => void
  content: string
}

type InputConfirmOptions = Omit<ConfirmOptions, 'resolve' | 'type' | 'active' | 'ok'>

export interface MessageOptions extends DialogOptions {
  type: 'message'
  timeout?: number
  status: 'success' | 'loading' | 'error'
  process?: Promise<unknown>
  loadingText?: string
  successText?: string
  errorText?: string
}

type InputMessageOptions = Omit<MessageOptions, 'type'>

type InputSuccessMessageOptions = Omit<InputMessageOptions, 'status' | 'process' | 'loadingText'>

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

  function update<T>(id: string, value: DeepPartial<T>) {
    const dialog = list.value.find(item => item.id === id)
    if (!dialog)
      return
    Object.assign(dialog, value)
  }

  return { list, confirm, remove, message, update }
})

export function useDialog() {
  const store = useDialogStore()
  const { t } = useI18n()

  const list: string[] = []

  onScopeDispose(() => {
    list.forEach(id => store.remove(id))
  })

  function confirm(options: InputConfirmOptions) {
    return new Promise<boolean>((resolve) => {
      const id = store.confirm({
        type: 'confirm',
        active: true,
        ok: false,
        resolve,
        ...options,
      })
      list.push(id)
    })
  }

  function message(options: InputMessageOptions) {
    const id = store.message({
      type: 'message',
      width: 'fit-content',
      ...options,
    })
    list.push(id)

    function close() {
      const timeout = options.timeout || 2000
      setTimeout(() => {
        store.remove(id)
      }, timeout)
    }

    if (options.process) {
      const loading = waitProcess(() => options.process, 500)
      loading.then(() => {
        store.update<MessageOptions>(id, {
          status: 'success',
        })
        close()
      })
      return loading
    }
    else {
      close()
    }
  }

  message.success = function (options?: InputSuccessMessageOptions) {
    return message({
      status: 'success',
      successText: t('dialog.success'),
      ...options,
    }) as undefined
  }

  message.loading = function (options: InputLoadingMessageOptions) {
    return message({
      status: 'loading',
      loadingText: t('dialog.loading'),
      successText: t('dialog.success'),
      ...options,
    }) as Promise<void>
  }

  message.error = function (options?: InputSuccessMessageOptions) {
    return message({
      status: 'error',
      errorText: t('dialog.error'),
      ...options,
    }) as undefined
  }

  return {
    confirm,
    message,
  }
}
