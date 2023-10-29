import type { VColorPicker, VTextField } from 'vuetify/lib/components/index.mjs'
import type { AllowedComponentProps, VNodeProps } from 'vue'

type ComponentProps<C extends Component> = C extends new (...args: any) => any
  ? Omit<InstanceType<C>['$props'], keyof VNodeProps | keyof AllowedComponentProps>
  : never

interface FormItemProps {
  textField: ComponentProps<typeof VTextField>
  colorPicker: ComponentProps<typeof VColorPicker>
}

export interface FormItem<T extends keyof FormItemProps> {
  type: T
  key: string
  label: string
  value?: FormItemProps[T]['modelValue']
  validationSchema?: Function
  props?: FormItemProps[T]
}

export type Form = Array<FormItem<keyof FormItemProps>>
