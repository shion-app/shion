// import { getVersion } from '@tauri-apps/plugin-app'
import { Store } from '@tauri-apps/plugin-store'
import i18next from 'i18next'
import { useTheme } from 'vuetify/lib/framework.mjs'
import { invoke } from '@tauri-apps/api/core'

import { FaviconService } from '@/modules/favicon'

interface Config {
  version: string
  locale: 'zh-CN' | 'en-US'
  checkUpdate: boolean
  autostart: boolean
  runAsAdmin: boolean
  launchVisible: boolean
  timelineMinMinute: number
  timelineGroupGapMinute: number
  themeColor: string
  tour: boolean
  autoShowChangelogDisable: boolean
  watcherWhitelist: Array<string>
  faviconService: FaviconService
  scheduledExport: boolean
  scheduledExportPath: string
  scheduledExportPeriod: number
  lastExport: number
}

const PATH = 'config.json'

export const useConfigStore = defineStore('config', () => {
  const changelog = useChangelogStore()

  const { locale, t } = useI18n()

  const store = new Store(PATH)
  const config = ref({} as Config)
  const ready = ref(false)
  const theme = useTheme()

  async function init() {
    const data: Config = {
      // TODO: upgrade
      version: await invoke('plugin:app|version'),
      locale: await invoke('get_sys_locale'),
      checkUpdate: false,
      autostart: false,
      runAsAdmin: false,
      launchVisible: true,
      timelineMinMinute: 0,
      timelineGroupGapMinute: 30,
      themeColor: '#512DA8',
      tour: true,
      autoShowChangelogDisable: false,
      watcherWhitelist: [],
      faviconService: FaviconService.IconHorse,
      scheduledExport: false,
      scheduledExportPath: '',
      scheduledExportPeriod: calcDuration(1, 'week'),
      lastExport: 0,
    }
    const len = await store.length()
    if (len == 0)
      await create(data)

    await read()
    const isVersionChanged = config.value.version != data.version
    update(data)
    if (isVersionChanged)
      handleVersionChange()

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

  async function handleVersionChange() {
    if (!config.value.autoShowChangelogDisable)
      changelog.toggleDialog()
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
      invoke('update_tray_menu', {
        data: {
          quit: t('tray.quit'),
        },
      })
    }
  })

  watch(() => config.value.themeColor, (v) => {
    theme.themes.value.light.colors.primary = v
  })

  return {
    config,
    ready,
  }
})
