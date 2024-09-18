import type { TooltipComponentPositionCallback } from 'echarts'

export function useEcharts() {
  const { bottom, mouseY } = layoutMainInject()
  const parentEl = useParentElement()
  const { theme } = useVuetifyTheme()

  const position: TooltipComponentPositionCallback = (point, _, __, ___, size) => {
    if (!parentEl.value)
      return [0, 0]

    const { top: parentTop } = parentEl.value.getBoundingClientRect()

    const [x] = point
    const [contentWidth, contentHeight] = size.contentSize
    const [viewWidth] = size.viewSize

    const offset = 20
    let left = x + offset
    let top = mouseY.value - parentTop

    if (x + contentWidth > viewWidth) {
      left = x - contentWidth - offset
      if (left < 0)
        left = x - contentWidth / 2
    }

    if (mouseY.value + contentHeight > bottom.value)
      top = mouseY.value - contentHeight - parentTop

    return [left, top]
  }

  return {
    position,
    theme,
  }
}
