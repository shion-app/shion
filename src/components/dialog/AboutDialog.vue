<script setup lang="ts">
import { open } from '@tauri-apps/api/shell'

import logo from '@/assets/logo.png'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)

const configStore = useConfigStore()
const { config } = storeToRefs(configStore)

const repository = 'https://github.com/shion-app/shion'

const website = computed(() => config.value.locale == 'zh-CN' ? 'https://shion.app/zh/' : 'https://shion.app/')
const version = computed(() => `v${config.value.version}`)
</script>

<template>
  <v-dialog v-model="visibleVModel" width="400">
    <v-card>
      <v-card-title>{{ $t('titleBar.help.about') }}</v-card-title>
      <v-card-text flex flex-col items-center>
        <img width="96" height="96" :src="logo" alt="logo">
        <div flex items-baseline mt-4>
          <div text-6 font-bold>
            shion
          </div>
          <div>
            ({{ version }})
          </div>
        </div>
      </v-card-text>
      <v-card-actions flex justify-center>
        <v-tooltip :text="$t('about.website')" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <v-btn icon="mdi-web" variant="text" v-bind="tooltipProps" @click="open(website)" />
          </template>
        </v-tooltip>
        <v-tooltip :text="$t('about.github')" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <v-btn icon="mdi-github" variant="text" v-bind="tooltipProps" @click="open(repository)" />
          </template>
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
