import { useTheme } from 'vuetify'

export const enum ColorMode {
  Light = 'light',
  Dark = 'dark',
  Auto = 'auto',
}

export function useVuetifyColorMode() {
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

export function useVuetifyTheme() {
  const theme = useTheme()
  const { name } = theme.global

  const isDark = computed(() => name.value == 'dark')

  const textColor = computed(() => isDark.value ? '#ffffff' : '#000000')

  const backgorundColor = computed(() => isDark.value ? '#313131' : '#ffffff')

  return {
    theme: name,
    isDark,
    textColor,
    backgorundColor,
  }
}
