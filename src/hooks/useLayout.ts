interface LayoutProvide {
  railWidth: number
  footerHeight: number
  headerHeight: number
  dragged: Ref<boolean>
  toggleDrag: (value?: boolean | undefined) => boolean
  isGrid: Ref<boolean>
  toggleIsGrid: (value?: boolean | undefined) => boolean
}

interface LayoutMainProvide {
  bottom: Ref<number>
  mouseY: Ref<number>
}

const layoutSymbol: InjectionKey<LayoutProvide> = Symbol('layout')
const layoutMainSymbol: InjectionKey<LayoutMainProvide> = Symbol('layoutMain')

export function layoutProvide(p: LayoutProvide) {
  return provide(layoutSymbol, p)
}

export function layoutInject() {
  return inject(layoutSymbol)!
}

export function layoutMainProvide(p: LayoutMainProvide) {
  return provide(layoutMainSymbol, p)
}

export function layoutMainInject() {
  return inject(layoutMainSymbol)!
}
