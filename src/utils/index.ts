export function randomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * 16)]

  return color
}

export const createIconBlob = (buffer: number[]) => new Blob([new Uint8Array(buffer)], { type: 'image/png' })

export function includeKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = {} as T
  Object.keys(obj).forEach((key) => {
    if (keys.includes(key as K))
      result[key as keyof T] = obj[key as keyof T]
  })
  return result
}

export function sleep(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

function isObject(obj): obj is object {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export function deepFilter(input: unknown, keys: string[]) {
  if (Array.isArray(input)) {
    const filteredArr = input.map(el => deepFilter(el, keys))
    return filteredArr
  }

  if (!isObject(input))
    return input

  const filteredObj = {}
  const entries = Object.entries(input)
  entries.forEach(([key, val]) => {
    if (!keys.includes(key)) {
      const filteredVal = deepFilter(val, keys)
      filteredObj[key] = filteredVal
    }
  })

  return filteredObj
}

export interface StepCounter {
  get: (count: number) => number
}

/**
 * 在取值时将list中同一数值错开
 */
export function randomStep(list: number[], unreachable = 0): StepCounter {
  const outside = [...list].sort()
  const inside = [...outside]

  for (let i = 1; i < inside.length; i++) {
    if (inside[i] <= inside[i - 1])
      inside[i] = inside[i - 1] + 1
  }

  return {
    get: (count: number) => {
      const index = outside.indexOf(count)
      if (index == -1) {
        return count
      }
      else {
        outside[index] = unreachable
        return inside[index]
      }
    },
  }
}

function promiseStatus(p: Promise<unknown>) {
  const t = {}
  return Promise.race([p, t]).then(v => v === t ? 'pending' : 'fulfilled', () => 'rejected')
}

export async function isPromisePending(p: Promise<unknown>) {
  return (await promiseStatus(p)) == 'pending'
}
