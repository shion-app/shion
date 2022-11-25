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
  type: 'confirm'
  title?: string
  content: string
  resolve: (ok: boolean) => void
}

type InputDialogOptions = Pick<DialogOptions, 'title' | 'content' | keyof DimensionProps>

type WithResolveInputDialogOptions = InputDialogOptions & Pick<DialogOptions, 'resolve'>

export interface DialogProps extends DialogOptions {
  id: string
  modelValue: boolean
  ok: boolean
}

export const useDialogStore = defineStore('dialog', () => {
  const list = ref<Array<DialogProps>>([])

  function add(options: DialogOptions) {
    const id = nanoid()
    const props: DialogProps = {
      ...options,
      id,
      modelValue: true,
      ok: true,
    }
    list.value.push(props)
    return id
  }

  function remove(id: string) {
    removeBy(list.value, item => item.id === id)
  }

  function confirm(options: WithResolveInputDialogOptions) {
    return add({
      ...options,
      type: 'confirm',
    })
  }

  return { list, confirm, remove }
})

export function useDialog() {
  const store = useDialogStore()

  const list: string[] = []

  onScopeDispose(() => {
    list.forEach(id => store.remove(id))
  })

  const confirm = (options: InputDialogOptions) => {
    return new Promise((resolve) => {
      const id = store.confirm({
        ...options,
        resolve,
      })
      list.push(id)
    })
  }

  return {
    confirm,
  }
}
