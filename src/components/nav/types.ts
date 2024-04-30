export interface NavButton {
  icon: string
  activeIcon: string
  name: string
  to: string
  key: string
  children?: NavButton[]
}
