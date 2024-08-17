<script setup lang="ts">
import type { TimeLineNodeCommonGraphData } from '@/interfaces'
import type { SelectActivity } from '@/modules/database'

const props = defineProps<{
  data: TimeLineNodeCommonGraphData
  raw: SelectActivity
}>()

defineOptions({
  inheritAttrs: false,
})

const { formatHHmmss } = useDateFns()
</script>

<template>
  <div v-bind="$attrs">
    <v-img :src="props.raw.program.icon" :width="16" :height="16" />
  </div>
  <div>
    <div :class="props.data.children ? 'line-clamp-2' : 'line-clamp-1'" break-all>
      {{ props.data.title }}
    </div>
    <div v-if="props.data.children">
      {{ $t('timelineGraph.include', {
        count: props.data.children,
        totalTime: formatHHmmss(props.data.totalTime),
      }) }}
    </div>
  </div>
</template>
