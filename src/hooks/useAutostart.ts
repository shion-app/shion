import { invoke } from '@tauri-apps/api/core'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { error } from '@tauri-apps/plugin-log'

export function useAutostart() {
  const configStore = useConfigStore()
  const { config, ready } = storeToRefs(configStore)

  const notify = useNotify()

  async function init() {
    config.value.runAsAdmin = await invoke('is_enabled_admin_autostart')
    config.value.autostart = config.value.runAsAdmin || await isEnabled()
  }

  async function disableAutostart() {
    if (await isEnabled())
      await disable()
  }

  async function enableAutostart() {
    await enable()
  }

  async function disableAdminAutostart() {
    if (await invoke('is_enabled_admin_autostart'))
      await invoke('disable_admin_autostart')
  }

  async function enableAdminAutostart() {
    await invoke('enable_admin_autostart')
  }

  const autostart = computed({
    get: () => config.value.autostart,
    set: async (v) => {
      config.value.autostart = v
      try {
        if (v) {
          await enableAutostart()
        }

        else {
          await disableAutostart()
          if (config.value.runAsAdmin) {
            await disableAdminAutostart()
            config.value.runAsAdmin = false
          }
        }
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

  const runAsAdmin = computed({
    get: () => config.value.runAsAdmin,
    set: async (v) => {
      config.value.runAsAdmin = v
      try {
        if (v) {
          await enableAdminAutostart()
          await disableAutostart()
        }

        else {
          await disableAdminAutostart()
          await enableAutostart()
        }
      }
      catch (e) {
        config.value.runAsAdmin = !v
        error(`autostart error: ${e}`)
        notify.error({
          text: e as string,
        })
      }
    },
  })

  whenever(ready, init)

  return {
    autostart,
    runAsAdmin,
  }
}
