interface TimelineProvide {
  handleSuccess: () => Promise<void>
}

const timelineSymbol: InjectionKey<TimelineProvide> = Symbol('timeline')

export function timelineProvide(p: TimelineProvide) {
  return provide(timelineSymbol, p)
}

export function timelineInject() {
  return inject(timelineSymbol)!
}
