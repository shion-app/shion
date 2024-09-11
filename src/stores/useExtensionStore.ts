import { Store } from '@tauri-apps/plugin-store'
import mergeOptions from 'merge-options'

interface Config {
  dandanplay: {
    port: number
    path: string
  }
  obsidian: {
    workspace: string[]
    created: string
    updated: string
  }
}

const PATH = 'extension.json'

export const useExtensionStore = defineStore('extension', () => {
  const store = new Store(PATH)
  const defaultConfig = {
    dandanplay: {
      port: 0,
      path: '',
    },
    obsidian: {
      workspace: [],
      created: 'created',
      updated: 'updated',
    },
  }
  const config = ref<Config>(mergeOptions({}, defaultConfig))
  const ready = ref(false)

  async function init() {
    const len = await store.length()
    if (len == 0)
      await create(defaultConfig)

    await read()
    update(defaultConfig)

    ready.value = true
  }

  async function create(data: Config) {
    for (const key in data)
      store.set(key, data[key as keyof Config])

    store.save()
  }

  async function read() {
    config.value = Object.fromEntries(await store.entries()) as unknown as Config
  }

  function update(data: Config) {
    config.value = mergeOptions(data, config.value)
  }

  init()

  watchDebounced(config, (v) => {
    for (const key in v)
      store.set(key, v[key as keyof Config])

    store.save()
  }, {
    debounce: 2000,
    deep: true,
  })

  return {
    config,
    ready,
  }
})
