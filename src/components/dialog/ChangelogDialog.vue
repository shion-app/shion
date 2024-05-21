<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'

import type { Release } from '@/modules/changelog'
import { parseChangelog } from '@/modules/changelog'

const props = defineProps<{
  visible: boolean
}>()

const { visible: visibleVModel } = useVModels(props)
const configStore = useConfigStore()

const { config, ready } = storeToRefs(configStore)

const changelog = ref<Release>({
  notes: '',
  title: '',
  version: '',
})

const content = computed(() => `## ${changelog.value.title}\n${changelog.value.notes}`)

function b64DecodeUnicode(str: string) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
    return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`
  }).join(''))
}

async function init() {
  const url = `https://api.github.com/repos/shion-app/shion/contents/changelog/${config.value.locale}.md`
  const data = await (await fetch(url)).json()
  if (data.content) {
    const release = await parseChangelog(b64DecodeUnicode(data.content), config.value.version)
    if (release)
      changelog.value = release
  }
}

watch(ready, init)

watch(() => config.value.locale, init)
</script>

<template>
  <advanced-dialog v-model:visible="visibleVModel" :title="$t('titleBar.help.changelog')">
    <v-card-text class="sm:max-h-[400px]" overflow-y-auto>
      <MdPreview v-if="changelog.notes" id="preview-only" :model-value="content" />
      <empty v-else mb-6 :desc="$t('changelog.empty')" />
    </v-card-text>
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
