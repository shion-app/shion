export function removeBy<T>(list: T[], predicate: (value: T, index: number, obj: T[]) => boolean) {
  const index = list.findIndex(predicate)
  if (index !== -1)
    list.splice(index, 1)
}
