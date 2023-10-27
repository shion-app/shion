interface LayoutProvide {
  railWidth: number
  footerHeight: number
}

export const layoutSymbol: InjectionKey<LayoutProvide> = Symbol('layout')
