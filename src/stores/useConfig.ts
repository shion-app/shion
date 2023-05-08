import { Store } from 'tauri-plugin-store-api'
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api'

interface Config {
  version: string
  locale: 'zh-CN' | 'en-US'
}

const PATH = `config${import.meta.env.DEV ? '-dev' : ''}.json`

export const useConfig = defineStore('config', () => {
  const { locale, t } = useI18n()

  const store = new Store(PATH)
  const config = ref<Config>({} as Config)

  async function init() {
    const len = await store.length()
    if (len == 0)
      await create()

    await read()
  }

  async function create() {
    const data: Config = {
      version: await getVersion(),
      locale: 'en-US',
    }
    for (const key in data)
      store.set(key, data[key as keyof Config])

    store.save()
  }

  async function read() {
    const data = {} as Config
    for (const [key, value] of await store.entries())
      data[key] = value

    config.value = data
  }

  init()

  watch(config, (v) => {
    for (const key in v)
      store.set(key, v[key as keyof Config])

    store.save()
  }, {
    deep: true,
  })

  watch(() => config.value.locale, (v) => {
    locale.value = v
    invoke('update_tray_menu', {
      data: {
        quit: t('tray.quit'),
      },
    })
  })

  return {
    config,
  }
})
