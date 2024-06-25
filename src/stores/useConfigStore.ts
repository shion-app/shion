// import { getVersion } from '@tauri-apps/plugin-app'
import { Store } from '@tauri-apps/plugin-store'
import { core } from '@tauri-apps/api'
import i18next from 'i18next'
import { useTheme } from 'vuetify/lib/framework.mjs'
import { error } from '@tauri-apps/plugin-log'
import { invoke } from '@tauri-apps/api/core'
import { disable, isEnabled } from '@tauri-apps/plugin-autostart'

import { FaviconService } from '@/modules/favicon'

interface Config {
  version: string
  locale: 'zh-CN' | 'en-US'
  checkUpdate: boolean
  autostart: boolean
  launchVisible: boolean
  timelineMinMinute: number
  timelineGroupGapMinute: number
  themeColor: string
  tour: boolean
  autoShowChangelogDisable: boolean
  watcherWhitelist: Array<string>
  faviconService: FaviconService
}

const PATH = 'config.json'

export const useConfigStore = defineStore('config', () => {
  const changelog = useChangelogStore()

  const { locale, t } = useI18n()
  const notify = useNotify()

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
      launchVisible: true,
      timelineMinMinute: 0,
      timelineGroupGapMinute: 30,
      themeColor: '#512DA8',
      tour: true,
      autoShowChangelogDisable: false,
      watcherWhitelist: [],
      faviconService: FaviconService.IconHorse,
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
    // 软件改为默认管理员身份启动后，改变开机启动方式
    if (await isEnabled()) {
      disable()
      await invoke('enable_autostart')
    }
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

  watch(() => config.value.themeColor, (v) => {
    theme.themes.value.light.colors.primary = v
  })

  // 迁移时，临时添加判断
  watchOnce(() => config.value.autostart, async (v) => {
    if (v)
      await invoke('enable_autostart')
  })

  const autostart = computed({
    get: () => config.value.autostart,
    set: async (v) => {
      config.value.autostart = v
      try {
        if (v)
          await invoke('enable_autostart')

        else
          await invoke('disable_autostart')
      }
      catch (e) {
        config.value.autostart = !v
        error(`autostart error: ${e}`)
        notify.error({
          text: e as string,
        })
      }
    },
  })

  return {
    config,
    ready,
    autostart,
  }
})
