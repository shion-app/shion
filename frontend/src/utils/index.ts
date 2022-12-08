import { zhCN } from 'date-fns/locale'
import isPromise from 'is-promise'

export function wait(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export async function waitProcess(process: () => unknown | Promise<unknown>, timeout: number) {
  const start = Date.now()
  const result = process()
  if (isPromise(result))
    await result
  const rest = timeout - (Date.now() - start)
  if (rest > 0)
    await wait(rest)
}

export function getDateLocale(locale: string) {
  switch (locale) {
    case 'zh-CN':
      return zhCN
  }
}

export function extractTime(time: number) {
  const milli = (time % 1000)
  time = ~~(time / 1000)
  const second = time % 60
  time = ~~(time / 60)
  const minute = time % 60
  const hour = ~~(time / 60)
  return {
    milli,
    second,
    minute,
    hour,
  }
}
