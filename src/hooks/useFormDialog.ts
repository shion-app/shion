import { useForm } from 'ant-design-vue/es/form'
import type { Callbacks } from 'ant-design-vue/es/form/interface'
import type { Props } from 'ant-design-vue/es/form/useForm'

interface DebounceSettings {
  leading?: boolean
  wait?: number
  trailing?: boolean
}

export function useFormDialog(visibleRef: Ref<boolean>, modelRef: Props | Ref<Props>, rulesRef?: Props | Ref<Props>, options?: {
  immediate?: boolean
  deep?: boolean
  validateOnRuleChange?: boolean
  debounce?: DebounceSettings
  onValidate?: Callbacks['onValidate']
}) {
  const { resetFields } = useForm(modelRef, rulesRef, options)

  function close() {
    visibleRef.value = false
    resetFields()
  }

  return {
    close,
  }
}
