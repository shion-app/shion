// import { getVersion } from '@tauri-apps/plugin-app'
import { Store } from '@tauri-apps/plugin-store'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { core } from '@tauri-apps/api'
import i18next from 'i18next'
import { useTheme } from 'vuetify/lib/framework.mjs'

interface Config {
  version: string
  locale: 'zh-CN' | 'en-US'
  checkUpdate: boolean
  autostart: boolean
  timelineMinMinute: number
  timelineGroupGapMinute: number
  themeColor: string
  tour: boolean
}

const PATH = 'config.json'

export const useConfigStore = defineStore('config', () => {
  const { locale, t } = useI18n()

  const store = new Store(PATH)
  const config = ref({} as Config)
  const ready = ref(false)
  const theme = useTheme()

  async function init() {
    const data: Config = {
      // TODO: upgrade
      version: await core.invoke('plugin:app|version'),
      locale: await core.invoke('get_sys_locale'),
      checkUpdate: false,
      autostart: false,
      timelineMinMinute: 1,
      timelineGroupGapMinute: 30,
      themeColor: '#512DA8',
      tour: true,
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
    if (isDesktop) {
      core.invoke('update_tray_menu', {
        data: {
          quit: t('tray.quit'),
        },
      })
    }
  })

  if (isDesktop) {
    watch(() => config.value.autostart, async (v) => {
      const switched = await isEnabled()
      if (v)
        enable()

      else if (switched)
        disable()
    })
  }
  watch(() => config.value.themeColor, (v) => {
    theme.themes.value.light.colors.primary = v
  })

  return {
    config,
    ready,
  }
})
