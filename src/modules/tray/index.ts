import { invoke } from '@tauri-apps/api/core'
import { TrayIcon } from '@tauri-apps/api/tray'
import { error } from '@tauri-apps/plugin-log'

import { i18n } from '@/locales'

export function checkTrayExists() {
  const timer = new Timer(async () => {
    const exists = await createTray()
    if (exists)
      timer.destroy()
  }, 3000)
}

async function createTray() {
  const icon = await TrayIcon.getById('tray')
  if (!icon) {
    try {
      await invoke('create_tray')
      await invoke('update_tray_menu', {
        data: {
          quit: i18n.global.t('tray.quit'),
        },
      })
    }
    catch (e) {
      error(`create tray error: ${e}`)
      return false
    }
  }
  return !!icon
}
