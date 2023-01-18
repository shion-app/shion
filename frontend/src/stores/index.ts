import { defineStore } from 'pinia'

interface Config {
  version: string
  locale: 'zh-CN' | 'en-US'
  autoCheckUpdate: boolean
}

export const useConfig = defineStore('config', () => {
  const config = ref<Config>({
    version: '0.1.0',
    locale: 'zh-CN',
    autoCheckUpdate: false,
  })

  return {
    config,
  }
})
