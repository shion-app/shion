import { breakpointsTailwind } from '@vueuse/core'

export function useTailwindBreakpoints() {
  const breakpoints = useBreakpoints(breakpointsTailwind)

  return {
    xs: breakpoints.smaller('sm'),
    sm: breakpoints.greaterOrEqual('sm'),
    md: breakpoints.greaterOrEqual('md'),
    lg: breakpoints.greaterOrEqual('lg'),
    xl: breakpoints.greaterOrEqual('xl'),
    xxl: breakpoints.greaterOrEqual('2xl'),
  }
}
