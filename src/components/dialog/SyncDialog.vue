<!-- <script setup lang="ts">
import { Status, getAuthUrl, isAuthorized, onMergeConflict, onStatusChanged, prepare, sync } from 'tauri-plugin-shion-synchronizer-api'
import { open } from '@tauri-apps/plugin-shell'
import { getCurrent } from '@tauri-apps/api/window'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)
const { success, error } = useNotify()
const { t } = useI18n()

const authorized = ref(false)
const syncing = ref(false)
const syncText = ref('')

;(async () => {
  authorized.value = await isAuthorized()
})()

async function authorize() {
  const url = await getAuthUrl()
  await open(url)
}

onStatusChanged((e) => {
  const { payload } = e
  if (payload == Status.Authorized) {
    authorized.value = true
    getCurrent().setFocus()
    success({
      text: t('sync.authorized'),
    })
  }
  else if (payload == Status.Pulled) {
    syncText.value = t('sync.pushing')
  }
  else if (payload == Status.Pushed) {
    syncText.value = t('sync.updating')
  }
})

async function handleSync() {
  const prepared = await prepare()
  if (!prepared) {
    await authorize()
    return
  }
  await suspendApp()
  syncing.value = true
  syncText.value = t('sync.pulling')
  try {
    await sync()
  }
  catch (e) {
    error({
      text: e as string,
    })
    return
  }
  finally {
    syncing.value = false
    syncText.value = t('sync.sync')
    await resumeApp()
  }
  success({})
}

onMergeConflict((e) => {
  error({
    text: t('sync.mergeConflict'),
  })
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.view.sync')" :persistent="syncing">
    <v-card-text space-y-4>
      <div flex>
        <div mr-4>
          {{ $t('sync.authorizationStatus') }}
        </div>
        <div :class="authorized ? 'i-mdi:check-circle text-green' : 'i-mdi:close-circle text-red'" text-6 />
      </div>
    </v-card-text>
    <v-card-actions>
      <div flex-1 />
      <v-btn v-if="authorized" color="primary" :disabled="syncing" @click="handleSync">
        {{ syncText || $t('sync.sync') }}
      </v-btn>
      <v-btn v-else color="primary" @click="authorize">
        {{ $t('sync.authorize') }}
      </v-btn>
    </v-card-actions>
  </advanced-dialog>
</template> -->
<template>
  <div />
</template>
