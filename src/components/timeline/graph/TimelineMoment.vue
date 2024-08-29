<script setup lang="ts">
import type { ObsidianNote } from '@/hooks/useObsidian'
import type { TimeLineNodeCommonGraphData } from '@/interfaces'

const props = defineProps<{
  data: TimeLineNodeCommonGraphData
  raw: ObsidianNote
}>()

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <a v-bind="$attrs" :href="`obsidian://open?path=${props.raw.path}`">
    <div i-mdi:pencil />
    <v-tooltip activator="parent" :text="$t('timelineGraph.moment.tooltip')" location="start" />
  </a>
  <div>
    <div class="line-clamp-1" break-all>
      {{ props.data.title }}
    </div>
  </div>
</template>
