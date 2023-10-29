export interface Menu {
  key: string
  title: string
  icon?: string
  children?: Array<Menu>
  click?: Function
}

export { FormItem } from '@components/modal/types'
