import isPromise from 'is-promise'

export function remove<T>(list: T[], predicate: (value: T, index: number, obj: T[]) => boolean) {
  const index = list.findIndex(predicate)
  if (index !== -1)
    list.splice(index, 1)
}

export function wait(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export async function waitProcess(process: () => void | Promise<unknown>, timeout: number) {
  const start = Date.now()
  const result = process()
  if (isPromise(result))
    await result
  const rest = timeout - (Date.now() - start)
  if (rest > 0)
    await wait(rest)
}

