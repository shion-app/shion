import { Store } from '@tauri-apps/plugin-store'
import { onStatusChanged } from 'tauri-plugin-shion-watcher-api'
import mergeOptions from 'merge-options'

import { dandanplay as dandanplayExtension } from '@/modules/extension/dandanplay'

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
  const monitorStore = useMonitorStore()

  const store = new Store(PATH)
  const config = ref({} as Config)
  const ready = ref(false)

  const dandanplay = dandanplayExtension()

  async function init() {
    const data: Config = {
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
    const len = await store.length()
    if (len == 0)
      await create(data)

    await read()
    update(data)

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

  function getDandanplayInfo() {
    return {
      port: config.value.dandanplay.port,
      id: monitorStore.whiteList.find(i => i.path == config.value.dandanplay.path)?.id,
    }
  }

  init()

  function activate() {
    const { port, id } = getDandanplayInfo()
    if (id)
      dandanplay.activate(port, id)
  }

  function inactivate() {
    dandanplay.inactivate()
  }

  watchDebounced(config, (v) => {
    for (const key in v)
      store.set(key, v[key as keyof Config])

    store.save()
  }, {
    debounce: 2000,
    deep: true,
  })

  onAppResume(activate)

  onAppSuspend(inactivate)

  onStatusChanged((e) => {
    const { path, active } = e.payload
    if (path != config.value.dandanplay.path)
      return

    if (active)
      activate()
    else
      inactivate()
  })

  return {
    config,
    ready,
  }
})
