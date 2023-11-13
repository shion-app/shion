import { Store } from 'tauri-plugin-store-api'
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api'
import { disable, enable, isEnabled } from 'tauri-plugin-autostart-api'
import i18next from 'i18next'

interface Config {
  version: string
  locale: 'zh-CN' | 'en-US'
  checkUpdate: boolean
  autostart: boolean
  timelineMinMinute: number
}

const PATH = 'config.json'

export const useConfigStore = defineStore('config', () => {
  const { locale, t } = useI18n()

  const store = new Store(PATH)
  const config = ref({} as Config)

  async function init() {
    const data: Config = {
      version: await getVersion(),
      locale: 'en-US',
      checkUpdate: false,
      autostart: false,
      timelineMinMinute: 1,
    }
    const len = await store.length()
    if (len == 0)
      await create(data)

    await read()
    update(data)
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
      if (key == 'version' || !Object.hasOwn(config.value, key))
        temp[key] = data[key]
    }
    Object.assign(config.value, temp)
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
    i18next.changeLanguage(v)
    locale.value = v
    invoke('update_tray_menu', {
      data: {
        quit: t('tray.quit'),
      },
    })
  })

  watch(() => config.value.autostart, async (v) => {
    const switched = await isEnabled()
    if (v)
      enable()

    else if (switched)
      disable()
  })

  return {
    config,
  }
})
