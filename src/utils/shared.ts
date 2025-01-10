export const PLATFORM: string = import.meta.env.TAURI_ENV_PLATFORM

export const isWindows = PLATFORM == 'windows'

export const isDesktop = isWindows

export const isAndorid = PLATFORM == 'android'

export const isMobile = isAndorid

export const isDev = import.meta.env.DEV

export const isProd = !isDev

export const dayMap = {
  'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
  'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

export const dayFullMap = {
  'zh-CN': ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  'en-US': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}
