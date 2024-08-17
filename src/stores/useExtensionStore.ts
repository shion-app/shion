import { Store } from '@tauri-apps/plugin-store'
import { onStatusChanged } from 'tauri-plugin-shion-watcher-api'
import { dandanplay as dandanplayExtension } from '@/modules/extension/dandanplay'

interface Config {
  dandanplayPort: number
  dandanplaypath: string
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
      dandanplayPort: 0,
      dandanplaypath: '',
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
    const temp = {}
    for (const key in data) {
      if (!Object.hasOwn(config.value, key))
        temp[key] = data[key]
    }
    Object.assign(config.value, temp)
  }

  function getDandanplayInfo() {
    return {
      port: config.value.dandanplayPort,
      id: monitorStore.whiteList.find(i => i.path == config.value.dandanplaypath)?.id,
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
    if (path != config.value.dandanplaypath)
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
