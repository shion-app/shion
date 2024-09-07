import type { Ref } from 'vue'
import { onBeforeUpdate, ref } from 'vue'

export type TemplateRefsList<T> = T[] & {
  set: (el: object | null) => void
  clear: () => void
}

export function useRefList<T = Element>(): Readonly<Ref<Readonly<TemplateRefsList<T>>>> {
  const refs = ref<unknown>([]) as Ref<TemplateRefsList<T>>
  refs.value.set = (el: object | null) => {
    if (el)
      refs.value.push(el as T)
  }
  refs.value.clear = () => {
    refs.value.length = 0
  }
  onBeforeUpdate(refs.value.clear)
  return refs
}
