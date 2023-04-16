import type { Menu } from '../interfaces/'

export function useMore() {
  const menu = ref<Menu>({
    key: 'more',
    title: 'more',
    icon: 'i-mdi:dots-vertical',
    children: [],
  })

  const map = new Map<string, Function>()

  function set(menu: Menu, path: string[] = []) {
    if (!menu.children)
      return

    path.push(menu.key)

    for (const item of menu.children) {
      if (item.click) {
        const key = [...path, item.key].join('.')
        map.set(key, item.click)
      }
      set(item, path)
    }
  }

  const unwatch = watch(menu, (v) => {
    map.clear()
    set(v)
  }, {
    deep: true,
  })

  tryOnScopeDispose(() => {
    unwatch()
    menu.value.children = []
  })

  function handler(info) {
    const { keyPath } = info
    const key = (keyPath as string[]).join('.')
    const click = map.get(key)
    if (click)
      click()
  }

  return {
    menu,
    handler,
  }
}
