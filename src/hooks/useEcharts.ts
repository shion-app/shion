import type { TooltipComponentPositionCallback } from 'echarts'

export function useEcharts() {
  const { bottom, mouseY } = layoutMainInject()
  const parentEl = useParentElement()
  const { top: parentTop } = useElementBounding(parentEl)

  const position: TooltipComponentPositionCallback = (point, _, __, ___, size) => {
    const [x] = point
    const [contentWidth, contentHeight] = size.contentSize
    const [viewWidth] = size.viewSize

    const offset = 20
    let left = x + offset
    let top = mouseY.value - parentTop.value

    if (x + contentWidth > viewWidth) {
      left = x - contentWidth - offset
      if (left < 0)
        left = x - contentWidth / 2
    }

    if (mouseY.value + contentHeight > bottom.value)
      top = mouseY.value - contentHeight - parentTop.value

    return [left, top]
  }

  return {
    position,
  }
}
