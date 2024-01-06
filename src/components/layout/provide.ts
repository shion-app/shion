interface LayoutProvide {
  railWidth: number
  footerHeight: number
  headerHeight: number
}
interface LayoutMainProvide {
  dragged: Ref<boolean>
  toggleDrag: (value?: boolean | undefined) => boolean
}

export const layoutSymbol: InjectionKey<LayoutProvide> = Symbol('layout')

const layoutMainSymbol: InjectionKey<LayoutMainProvide> = Symbol('layoutMain')

export function layoutMainProvide(p: LayoutMainProvide) {
  return provide(layoutMainSymbol, p)
}
export function layoutMainInject() {
  return inject(layoutMainSymbol)!
}
