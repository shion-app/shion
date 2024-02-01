<script setup lang="ts">
import { open } from '@tauri-apps/plugin-shell'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

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

const website = computed(() => config.value.locale == 'zh-CN' ? 'https://shion.app/zh/' : 'https://shion.app/')
const version = computed(() => `v${config.value.version}`)

async function copy() {
  await writeText(version.value)
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
        <div cursor-pointer @click="copy">
          ({{ version }})
        </div>
      </div>
      <v-btn :text="$t('about.checkUpdate')" :loading="updating" @click="start" />
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
  </advanced-dialog>
</template>
