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
