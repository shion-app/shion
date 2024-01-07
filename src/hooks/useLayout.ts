interface LayoutProvide {
  railWidth: number
  footerHeight: number
  headerHeight: number
  dragged: Ref<boolean>
  toggleDrag: (value?: boolean | undefined) => boolean
  isGrid: Ref<boolean>
  toggleIsGrid: (value?: boolean | undefined) => boolean
}

const layoutSymbol: InjectionKey<LayoutProvide> = Symbol('layout')

export function layoutProvide(p: LayoutProvide) {
  return provide(layoutSymbol, p)
}
export function layoutInject() {
  return inject(layoutSymbol)!
}
