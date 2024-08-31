<script setup lang="ts">
import { open } from '@tauri-apps/plugin-shell'

import type { ObsidianNote } from '@/hooks/useObsidian'
import type { TimeLineNodeCommonGraphData } from '@/interfaces'

const props = defineProps<{
  data: TimeLineNodeCommonGraphData
  raw: ObsidianNote
}>()

defineOptions({
  inheritAttrs: false,
})

function openObsidian() {
  open(`obsidian://open?path=${props.raw.path}`)
}
</script>

<template>
  <div v-bind="$attrs" i-mdi:pencil cursor-pointer @click="openObsidian">
    <v-tooltip activator="parent" :text="$t('timelineGraph.moment.tooltip')" location="start" />
  </div>
  <div>
    <div :class="props.data.children ? 'line-clamp-2' : 'line-clamp-1'" break-all>
      {{ props.data.title }}
    </div>
    <div v-if="props.data.children">
      {{ $t('timelineGraph.includeCount', {
        count: props.data.children,
      }) }}
    </div>
  </div>
</template>
