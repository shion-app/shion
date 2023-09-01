<script setup lang="ts">
import { open } from '@tauri-apps/api/shell'

import logo from '../assets/logo.png'

const configStore = useConfig()
const { config } = storeToRefs(configStore)

const repository = 'https://github.com/shion-app/shion'

const website = computed(() => config.value.locale == 'zh-CN' ? 'https://shion.app/zh/' : 'https://shion.app/')
const version = computed(() => `v${config.value.version}`)
</script>

<template>
  <div p-4 flex flex-col items-center>
    <img w-48 h-48 :src="logo" alt="logo">
    <div flex items-end m-t-4 leading-none>
      <div text-8 font-bold class="text-#9653cb">
        shion
      </div>
      <div class="release-tag">
        {{ version }}
      </div>
    </div>
    <div flex space-x-4 class="[&>*:hover]:cursor-pointer" m-t-32>
      <a-tooltip placement="bottom" :title="$t('about.website')">
        <div text-8 i-mdi:web @click="open(website)" />
      </a-tooltip>
      <a-tooltip placement="bottom" :title="$t('about.github')">
        <div text-8 i-mdi:github @click="open(repository)" />
      </a-tooltip>
    </div>
  </div>
</template>

<style scoped>
.release-tag {
    font-size: 14px;
    font-weight: 700;
    padding: 4px 6px;
    margin-left: 6px;
    background: #9653cb;
    color: #fff;
    border-radius: 10px;
    height: fit-content;
}
</style>
