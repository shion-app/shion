<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'

import zhCN from '../../../changelog/zh-CN.md?raw'
import enUS from '../../../changelog/en-US.md?raw'
import { type Release, parseChangelog } from '@/modules/changelog'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)
const configStore = useConfigStore()

const { config } = storeToRefs(configStore)

const data = computed(() => {
  switch (config.value.locale) {
    case 'zh-CN':
      return zhCN
    default:
      return enUS
  }
})

const changelog = ref<Release>({
  notes: '',
  title: '',
  version: '',
})

const content = computed(() => `## ${changelog.value.title}\n${changelog.value.notes}`)

watch(data, async (v) => {
  const release = await parseChangelog(v, config.value.version)
  if (release)
    changelog.value = release
})
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.help.changelog')">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <MdPreview v-if="changelog.notes" id="preview-only" :model-value="content" />
      <empty v-else :desc="$t('changelog.empty')" />
    </v-card-text>
    <v-card-actions class="justify-start!">
      <v-checkbox v-model="config.autoShowChangelogDisable" :label="$t('changelog.checkbox')" hide-details />
    </v-card-actions>
  </advanced-dialog>
</template>

<style lang="scss">
.md-editor-preview-wrapper {
  padding: 0;
}

.md-editor-preview {
  h2 {
    margin: 0;
  }

  li {
    list-style-type: disc;
  }
}
</style>
