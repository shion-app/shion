<script setup lang="ts">
import type { TimeLineNodeCommonGraphData } from '@/interfaces'
import type { SelectHistory } from '@/modules/database'
import { getFaviconUrl } from '@/modules/favicon'

const props = defineProps<{
  data: TimeLineNodeCommonGraphData
  raw: SelectHistory
}>()

defineOptions({
  inheritAttrs: false,
})

const configStore = useConfigStore()

const { config } = storeToRefs(configStore)
</script>

<template>
  <a v-bind="$attrs" :href="props.raw.url" target="_blank">
    <v-img :src="getFaviconUrl(config.faviconService, props.raw.domain.pattern)" :width="16" :height="16">
      <template #error>
        <div i-mdi:web />
      </template>
    </v-img>
    <v-tooltip activator="parent" :text="$t('timelineGraph.history.tooltip')" location="start" />
  </a>
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
