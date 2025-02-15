<script setup lang="ts">
import { error as logError } from '@tauri-apps/plugin-log'

import GoogleChrome from '@/assets/browser/Google Chrome.svg'
import MicrosoftEdge from '@/assets/browser/Microsoft Edge.svg'
import Firefox from '@/assets/browser/Firefox.svg'
import Arc from '@/assets/browser/Arc.svg'

interface Browser {
  name: string
  url: string
  used: boolean
  selected: boolean
}

const props = defineProps<{
  visible: boolean
}>()

const confirm = useConfirmModal()
const { t } = useI18n()
const { success, error, info } = useNotify()

const store = useHistoryStore()
const { config, progress, progressText, completedCount } = storeToRefs(store)
const { pull, cancel } = store

const pullDialogVisible = ref(false)

const browsers = ref<Array<Browser>>([])

const isDisableImport = computed(() => browsers.value.filter(i => !i.used).length == 0)
const isDisableCancel = computed(() => browsers.value.filter(i => i.selected).length == 0)

const { visible: visibleVModel } = useVModels(props)

watchDeep(() => config.value.browsers, (v) => {
  browsers.value = v.map(({ name, last_sync }) => ({
    name,
    url: getBrowserUrl(name),
    used: last_sync != 0,
    selected: false,
  }))
})

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

async function cancelSync() {
  const list = browsers.value.filter(i => i.selected).map(i => i.name)
  await cancel(list)
  success({})
}
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.history')">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <div>{{ $t('history.tip') }}</div>
      <div grid grid-cols-3>
        <v-hover v-for="browser in browsers" :key="browser.name">
          <template #default="{ isHovering, props: hoverProps }">
            <div p-4 flex flex-col items-center space-y-2 relative v-bind="hoverProps">
              <div
                :class="[browser.selected || isHovering ? 'opacity-100' : 'opacity-0', browser.used ? '' : 'hidden']" transition-opacity-400 absolute
                top-0 right-2 uno-card-surface
              >
                <v-checkbox v-model="browser.selected" hide-details density="comfortable" @click.stop />
              </div>
              <img :src="browser.url" :alt="browser.name" width="64" height="64" :class="browser.used ? '' : 'grayscale'">
              <div>{{ browser.name }}</div>
            </div>
          </template>
        </v-hover>
      </div>
    </v-card-text>
    <v-card-actions>
      <div flex-1 />
      <v-btn color="primary" :disabled="isDisableCancel" @click="cancelSync">
        {{ $t('history.cancel.button') }}
      </v-btn>
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
