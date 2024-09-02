<script setup lang="ts">
import { error as logError } from '@tauri-apps/plugin-log'

import GoogleChrome from '@/assets/browser/Google Chrome.svg'
import MicrosoftEdge from '@/assets/browser/Microsoft Edge.svg'
import Firefox from '@/assets/browser/Firefox.svg'
import Arc from '@/assets/browser/Arc.svg'

const props = defineProps<{
  visible: boolean
}>()

const confirm = useConfirmModal()
const { t } = useI18n()
const { success, error, info } = useNotify()

const store = useHistoryStore()
const { config, progress, progressText, completedCount } = storeToRefs(store)
const { pull } = store

const pullDialogVisible = ref(false)

const browsers = computed(() => config.value.browsers.map(({ name, last_sync }) => ({
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
    case 'Firefox':
      return Firefox
    case 'Arc':
      return Arc
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
    onConfirm: async () => {
      confirm.close()
      await nextTick()
      pullDialogVisible.value = true
      let total = 0
      try {
        total = await pull()
      }
      catch (e) {
        error({
          text: t('history.import.error'),
        })
        logError(`history import: ${e}`)
        return
      }
      finally {
        pullDialogVisible.value = false
      }
      if (total) {
        success({
          text: t('history.import.success'),
        })
      }
      else {
        info({
          text: t('history.import.empty'),
        })
      }
    },
  })
}
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.history')">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <div>{{ $t('history.tip') }}</div>
      <div grid grid-cols-3>
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
  <advanced-dialog v-model:visible="pullDialogVisible" :title="$t('history.import.running')" persistent>
    <v-card-text mb-4 space-y-2>
      <v-progress-linear color="primary" :model-value="progress" rounded height="10" />
      <div flex>
        <div
          :class="{
            hidden: completedCount > 0,
          }"
        >
          {{ $t('history.import.calculating') }}
        </div>
        <div flex-1 />
        <div>{{ progressText }}</div>
      </div>
    </v-card-text>
  </advanced-dialog>
</template>
