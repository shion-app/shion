import { defineStore } from 'pinia'

import type { main } from '../../wailsjs/go/models'

export const useConfig = defineStore('config', () => {
  const config = ref<main.Config>({
    version: '0.1.0',
    locale: 'zh-CN',
    autoCheckUpdate: false,
  })

  function read(data: main.Config) {
    for (const key in data)
      config.value[key] = data[key]
  }

  async function write(data: main.Config) {
    await WriteConfig(data)
  }

  return {
    config,
    read,
    write,
  }
})
