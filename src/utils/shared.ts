export const isWindows = import.meta.env.TAURI_ENV_PLATFORM == 'windows'

export const isDesktop = isWindows

export const isAndorid = import.meta.env.TAURI_ENV_PLATFORM == 'android'

export const isMobile = isAndorid

export const dayMap = {
  'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
  'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
