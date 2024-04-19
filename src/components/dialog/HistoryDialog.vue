<script setup lang="ts">
import { getConfig, readHistory, setConfig } from 'tauri-plugin-shion-history-api'
import { startOfDay } from 'date-fns'
import { error as logError } from '@tauri-apps/plugin-log'

import GoogleChrome from '@/assets/browser/Google Chrome.png'
import MicrosoftEdge from '@/assets/browser/Microsoft Edge.png'
import { db } from '@/modules/database'

const props = defineProps<{
  visible: boolean
}>()

const { state: historyConfig } = useAsyncState(getConfig(), {
  browsers: [],
}, {
  shallow: false,
})

const confirm = useConfirmModal()
const { t } = useI18n()
const { success, error } = useNotify()

const running = ref(false)

const browsers = computed(() => historyConfig.value.browsers.map(({ name, last_sync }) => ({
  name,
  url: getBrowserUrl(name),
  used: last_sync != 0,
})))
const isDisableImport = computed(() => running.value || browsers.value.filter(i => !i.used).length == 0)

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
  const list = browsers.value.filter(i => !i.used).map(i => i.name)
  confirm.require({
    title: t('modal.prompt'),
    content: t('history.import.confirm', {
      browsers: list,
    }),
    options: {
      loading: true,
    },
    onConfirm: async () => {
      running.value = true
      try {
        const end = startOfDay(new Date()).getTime()
        const historyList = await readHistory(list, 0, end)
        await db.history.batchInsert(historyList.map(({ title, url, last_visited }) => ({
          title,
          url,
          lastVisited: last_visited,
        })))
        const browsers = historyConfig.value.browsers.map(({ name }) => ({
          name,
          last_sync: end,
        }))
        const newConfig = {
          browsers,
        }
        historyConfig.value = newConfig
        await setConfig(newConfig)
      }
      catch (e) {
        error({
          text: t('history.import.error'),
        })
        logError(`history import: ${e}`)
        return
      }
      success({
        text: t('history.import.success'),
      })
    },
    onClosed() {
      running.value = false
    },

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
        {{ $t('history.import.button') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
</template>