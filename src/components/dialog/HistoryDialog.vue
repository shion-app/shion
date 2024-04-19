<script setup lang="ts">
import { getConfig } from 'tauri-plugin-shion-history-api'

import GoogleChrome from '@/assets/browser/Google Chrome.png'
import MicrosoftEdge from '@/assets/browser/Microsoft Edge.png'

const props = defineProps<{
  visible: boolean
}>()

const { state: historyConfig } = useAsyncState(getConfig(), {
  browsers: [],
})

const confirm = useConfirmModal()
const { t } = useI18n()

const browsers = computed(() => historyConfig.value.browsers.map(({ name, last_sync }) => ({
  name,
  url: getBrowserUrl(name),
  used: last_sync != 0,
})))

const isDisableImport = computed(() => browsers.value.filter(i => !i.used).length == 0)

const { visible: visibleVModel } = useVModels(props)

function getBrowserUrl(name: string) {
  switch (name) {
    case 'Google Chrome':
      return GoogleChrome
    case 'Microsoft Edge':
      return MicrosoftEdge
    default:
      return ''
  }
}

async function importBrowserData() {
  visibleVModel.value = false
  await nextTick()
  confirm.require({
    title: t('modal.prompt'),
    content: t('history.importConfirm', {
      browsers: browsers.value.filter(i => !i.used).map(i => i.name),
      onConfirm: async () => {

      },
    }),
  })
}
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.history')">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <div>{{ $t('history.tip') }}</div>
      <div flex>
        <div v-for="{ name, url, used } in browsers" :key="name" p-4 flex flex-col items-center space-y-2>
          <img :src="url" :alt="name" width="64" height="64" :class="used ? '' : 'grayscale'">
          <div>{{ name }}</div>
        </div>
      </div>
    </v-card-text>
    <v-card-actions>
      <div flex-1 />
      <v-btn color="primary" :disabled="isDisableImport" @click="importBrowserData">
        {{ $t('history.import') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
</template>
