<script setup lang="ts">
import { open } from '@tauri-apps/plugin-shell'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { invoke } from '@tauri-apps/api/core'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)
const { info } = useNotify()
const { t } = useI18n()

const configStore = useConfigStore()
const updateStore = useUpdateStore()
const { config } = storeToRefs(configStore)
const { start } = updateStore
const { updating } = storeToRefs(updateStore)

const repository = 'https://github.com/shion-app/shion'
const steam = 'https://store.steampowered.com/app/3026040/shion/'

const website = computed(() => config.value.locale == 'zh-CN' ? 'https://shion.app/zh/' : 'https://shion.app/')
const version = computed(() => `v${config.value.version}`)

async function update() {
  const open = await start(true)
  if (open) {
    visibleVModel.value = false
    open()
  }
}

async function copySystemInfo() {
  const locale = await invoke<string>('get_sys_locale')
  const data = `version: ${version.value}\nlocale: ${locale}\nuserAgent: ${navigator.userAgent}`
  await writeText(data)
  info({
    text: t('about.copy'),
  })
}
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.help.about')">
    <v-card-text flex flex-col items-center class="max-h-[250px]">
      <dynamic-logo />
      <div flex items-baseline my-4>
        <div text-6 font-bold>
          shion
        </div>
        <div>
          ({{ version }})
        </div>
      </div>
      <div flex space-x-4>
        <v-btn color="primary" :text="$t('about.checkUpdate')" :loading="updating" @click="update" />
        <v-btn :text="$t('about.appInfo')" @click="copySystemInfo" />
      </div>
    </v-card-text>
    <v-card-actions class="justify-center!">
      <tooltip-button location="bottom" :tooltip="$t('about.website')" icon="mdi-web" @click="open(website)" />
      <tooltip-button location="bottom" :tooltip="$t('about.github')" icon="mdi-github" @click="open(repository)" />
      <v-tooltip :text="$t('about.steam')" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn icon v-bind="tooltipProps" @click="open(steam)">
            <v-badge color="primary" content="pro">
              <v-icon>mdi-steam</v-icon>
            </v-badge>
          </v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </advanced-dialog>
</template>
