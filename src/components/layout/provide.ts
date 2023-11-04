interface LayoutProvide {
  railWidth: number
  footerHeight: number
  headerHeight: number
}

export const layoutSymbol: InjectionKey<LayoutProvide> = Symbol('layout')
