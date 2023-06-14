export interface Menu {
  key: string
  title: string
  icon?: string
  children?: Array<Menu>
  click?: Function
}

export interface Program {
  path: string
  description: string
  title: string
}

export * from './database'
