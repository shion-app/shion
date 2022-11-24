import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

import type { VDialog } from 'vuetify/lib/components/VDialog/index'

export function useDialog(props: VDialogProps = { modelValue: false }) {
  const id = nanoid()
  const store = useDialogStore()
  store.confirm(id, props)
  // const unwatch = watch(props, val => store.update(id, val), {
  //   deep: true,
  // })
  onScopeDispose(() => {
    store.remove(id)
    // unwatch()
  })
  return {
    toggle() {
      const show = store.prop(id, 'modelValue')
      store.update(id, {
        modelValue: !show,
      })
    },
  }
}

interface Dialog {
  id: string
  props: VDialogProps
}

type VDialogProps = VDialog['$props']

export const useDialogStore = defineStore('dialog', () => {
  const list = ref<Array<Dialog>>([])

  function add(id: string, props: VDialogProps) {
    const dialog = {
      id,
      props,
    }
    list.value.push(dialog)
  }

  function remove(id: string) {
    removeBy(list.value, item => item.id === id)
  }

  function confirm(id: string, props: VDialogProps) {
    add(id, props)
  }

  function update(id: string, props: VDialogProps) {
    const index = list.value.findIndex(item => item.id === id)
    Object.assign(list.value[index].props, props)
  }

  function prop(id: string, key: keyof VDialogProps) {
    const dialog = list.value.find(item => item.id === id)!
    return dialog.props[key]
  }

  return { list, confirm, remove, update, prop }
})
