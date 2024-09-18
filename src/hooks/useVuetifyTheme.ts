import { useTheme } from 'vuetify'

export const enum ColorMode {
  Light = 'light',
  Dark = 'dark',
  Auto = 'auto',
}

export function useVuetifyTheme() {
  const configStore = useConfigStore()
  const { config } = storeToRefs(configStore)

  const theme = useTheme()
  const mode = useColorMode()

  watch(() => config.value.colorMode, (v) => {
    mode.value = v
  })

  watchImmediate(mode, (v) => {
    theme.global.name.value = v
  })

  watch(() => config.value.themeColor, (v) => {
    theme.themes.value.light.colors.primary = v
    theme.themes.value.dark.colors.primary = v
  })

  return {
    theme: theme.global.name,
    mode,
  }
}
