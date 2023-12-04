import type { ComponentProps } from 'vue-component-type-helpers'
import type { VColorPicker, VSelect, VTextField } from 'vuetify/components'

import type { z as Zod, ZodObject } from 'zod'

interface FormItemProps {
  textField: ComponentProps<typeof VTextField>
  colorPicker: ComponentProps<typeof VColorPicker>
  select: ComponentProps<typeof VSelect>
}

export interface FormItem<T extends keyof FormItemProps> {
  type: T
  key: string
  label: string
  value?: FormItemProps[T]['modelValue']
  props?: FormItemProps[T]
}

export interface Form {
  fields: Array<FormItem<keyof FormItemProps>>
  values?: Record<string, unknown>
}

export type BuildSchemaObject = (z: typeof Zod) => ZodObject<any, any, any, any, any>
