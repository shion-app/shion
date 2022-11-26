export function pick(obj: object, list: string[]) {
  const result = {}
  for (const key of list)
    result[key] = obj[key]
  return result
}
