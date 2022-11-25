export function pick(obj: Record<string, unknown>, list: string[]) {
  const result = {}
  for (const key of list)
    result[key] = obj[key]
  return result
}
